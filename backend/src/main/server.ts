import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import * as dotenv from 'dotenv'
import cors from 'cors'
import type { NextFunction, Request, Response } from 'express'

import { initializeDatabase } from '../infrastructure/database/typeorm.config'
import { VectorRepository } from '../infrastructure/repositories/VectorRepository'
import { IngestionJobRepository } from '../infrastructure/repositories/IngestionJobRepository'
import { OllamaService } from '../infrastructure/services/OllamaService'
import { BullMqQueueProvider } from '../infrastructure/queue/BullMqQueueProvider'

import { EnqueueIngestionUseCase } from '../use-cases/EnqueueIngestionUseCase'
import { QueryRagUseCase } from '../use-cases/QueryRagUseCase'
import { IngestController } from '../infrastructure/https/controllers/IngestController'
import { CheckJobStatusController } from '../infrastructure/https/controllers/CheckJobStatusController'
import { ChatController } from '../infrastructure/https/controllers/ChatController'
import { SessionController } from '../infrastructure/https/controllers/SessionController'
import { CreateSessionUseCase } from '../use-cases/CreateSessionUseCase'
import { CreateSessionMessageUseCase } from '../use-cases/CreateSessionMessageUseCase'
import { GetSessionHistoryUseCase } from '../use-cases/GetSessionHistoryUseCase'
import { SessionRepository } from '../infrastructure/repositories/SessionRepository'
import { DeleteSessionMessageUseCase } from '../use-cases/DeleteSessionMessageUseCase'
import { DeleteSessionUseCase } from '../use-cases/DeleteSessionUseCase'
import { ListSessionsUseCase } from '../use-cases/ListSessionsUseCase'
import { UpdateSessionMessageUseCase } from '../use-cases/UpdateSessionMessageUseCase'
import { KnowledgeBaseController } from '../infrastructure/https/controllers/KnowledgeBaseController'
import { DeleteKnowledgeDocumentUseCase } from '../use-cases/DeleteKnowledgeDocumentUseCase'
import { ListKnowledgeDocumentsUseCase } from '../use-cases/ListKnowledgeDocumentsUseCase'
import { UpdateSessionTitleUseCase } from '../use-cases/UpdateSessionTitleUseCase'
import { SessionMemoryRepository } from '../infrastructure/repositories/SessionMemoryRepository'
import { UpdateSessionContextUseCase } from '../use-cases/UpdateSessionContextUseCase'

dotenv.config()

const app = express()
app.use(cors())

// Middleware global de log para você enxergar no terminal qualquer chamada recebida
app.use((req, res, next) => {
    console.log(`[HTTP Debug] ${req.method} ${req.url}`)
    next()
})

// Direcionamento dos Uploads para a raiz do projeto
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const supportedFileExtensions = new Set(['.pdf', '.docx', '.txt', '.html'])
const upload = multer({
    dest: uploadDir,
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase()
        if (!supportedFileExtensions.has(extension)) {
            callback(new Error('Formato não suportado. Envie PDF, DOCX, TXT ou HTML.'))
            return
        }
        callback(null, true)
    }
})

app.use(express.json())

const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434'
const embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'
const chatModel = process.env.OLLAMA_CHAT_MODEL || 'llama3:latest'

async function bootstrap() {
    try {
        // 1. Inicializa Conexão com o Banco de Dados
        console.log('[Server] Conectando ao PostgreSQL...')
        await initializeDatabase()
        console.log('[Server] Banco de dados inicializado com sucesso.')

        // 2. Instanciação dos Repositórios e Serviços de Infraestrutura
        const vectorRepo = new VectorRepository()
        const jobRepo = new IngestionJobRepository()
        const llmService = new OllamaService(ollamaHost, embeddingModel, chatModel)
        const sessionRepository = new SessionRepository()
        const sessionMemoryRepository = new SessionMemoryRepository()

        console.log('[Server] Conectando ao provedor de fila Redis (BullMQ)...')
        const queueProvider = new BullMqQueueProvider()

        // 3. Instanciação dos Casos de Uso
        const enqueueIngestionUseCase = new EnqueueIngestionUseCase(jobRepo, queueProvider)
        const queryRagUseCase = new QueryRagUseCase(
            vectorRepo,
            llmService,
            sessionRepository,
            sessionMemoryRepository
        )
        const createSessionUseCase = new CreateSessionUseCase(sessionRepository)
        const createSessionMessageUseCase = new CreateSessionMessageUseCase(sessionRepository)
        const updateSessionTitleUseCase = new UpdateSessionTitleUseCase(sessionRepository)
        const getHistoryUseCase = new GetSessionHistoryUseCase(sessionRepository)
        const listSessionsUseCase = new ListSessionsUseCase(sessionRepository)
        const updateSessionMessageUseCase = new UpdateSessionMessageUseCase(sessionRepository)
        const deleteSessionMessageUseCase = new DeleteSessionMessageUseCase(sessionRepository)
        const deleteSessionUseCase = new DeleteSessionUseCase(sessionRepository, sessionMemoryRepository)
        const updateSessionContextUseCase = new UpdateSessionContextUseCase(
            sessionRepository,
            sessionMemoryRepository
        )
        const listKnowledgeDocumentsUseCase = new ListKnowledgeDocumentsUseCase(vectorRepo)
        const deleteKnowledgeDocumentUseCase = new DeleteKnowledgeDocumentUseCase(vectorRepo)

        // 4. Instância dos Controllers
        const ingestController = new IngestController(enqueueIngestionUseCase)
        const checkJobStatusController = new CheckJobStatusController(jobRepo)
        const chatController = new ChatController(
            queryRagUseCase,
            createSessionMessageUseCase,
            updateSessionTitleUseCase
        )
        const knowledgeBaseController = new KnowledgeBaseController(
            listKnowledgeDocumentsUseCase,
            deleteKnowledgeDocumentUseCase
        )
        const sessionController = new SessionController(
            createSessionUseCase,
            createSessionMessageUseCase,
            getHistoryUseCase,
            listSessionsUseCase,
            updateSessionMessageUseCase,
            deleteSessionMessageUseCase,
            deleteSessionUseCase,
            updateSessionContextUseCase
        )

        // 5. Define routes
        app.post('/api/ingest', upload.single('file'), (req, res) => ingestController.handle(req, res))
        app.get('/api/ingest/status/:jobId', (req, res) => checkJobStatusController.handle(req, res))
        app.get('/api/knowledge/documents', (req, res) => knowledgeBaseController.listDocuments(req, res))
        app.delete('/api/knowledge/documents', (req, res) => knowledgeBaseController.deleteDocument(req, res))
        app.post('/api/chat', (req, res) => chatController.handle(req, res))
        app.post('/api/chat/stream', (req, res) => chatController.handleStream(req, res))
        app.post('/api/session', (req, res) => sessionController.create(req, res))
        app.post('/api/sessions', (req, res) => sessionController.create(req, res))
        app.get('/api/sessions', (req, res) => sessionController.list(req, res))
        app.get('/api/sessions/:sessionId/messages', (req, res) => sessionController.getHistory(req, res))
        app.get('/api/sessions/:sessionId/context-sessions', (req, res) =>
            sessionController.getContextSessions(req, res)
        )
        app.put('/api/sessions/:sessionId/context-sessions', (req, res) =>
            sessionController.updateContextSessions(req, res)
        )
        app.post('/api/sessions/:sessionId/messages', (req, res) => sessionController.createMessage(req, res))
        app.put('/api/sessions/:sessionId/messages/:messageId', (req, res) => sessionController.updateMessage(req, res))
        app.delete('/api/sessions/:sessionId/messages/:messageId', (req, res) => sessionController.deleteMessage(req, res))
        app.delete('/api/sessions/:sessionId', (req, res) => sessionController.delete(req, res))

        app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
            if (res.headersSent) {
                next(error)
                return
            }

            if (error instanceof multer.MulterError) {
                res.status(400).json({ error: 'Falha ao receber o arquivo.' })
                return
            }

            if (error instanceof Error) {
                res.status(400).json({ error: error.message })
                return
            }

            console.error('[Server] Erro HTTP não tratado:', error)
            res.status(500).json({ error: 'Erro interno do servidor.' })
        })

        // 6. Inicia o Servidor HTTP
        const port = Number(process.env.PORT) || 3000
        app.listen(port, '0.0.0.0', () => {
            console.log(`[Server] Servidor HTTP rodando na porta ${port}`)
        })

    } catch (error: any) {
        console.error('[Server Error] Falha durante a inicialização do bootstrap:', error)
    }
}

bootstrap()
