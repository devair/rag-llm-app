import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import * as dotenv from 'dotenv'
import cors from 'cors'

import { initializeDatabase } from '../infrastructure/database/typeorm.config'
import { VectorRepository } from '../infrastructure/repositories/VectorRepository'
import { IngestionJobRepository } from '../infrastructure/repositories/IngestionJobRepository'
import { OllamaService } from '../infrastructure/services/OllamaService'
import { BullMqQueueProvider } from '../infrastructure/queue/BullMqQueueProvider'

import { EnqueueIngestionUseCase } from '../use-cases/EnqueueIngestionUseCase'
import { QueryRagUseCase } from '../use-cases/QueryRagUseCase'
import { IngestController } from '../infrastructure/https/controllers/IngestController'
import { CheckJobStatusController } from '../infrastructure/https/controllers/CheckJobStatusController'

dotenv.config()


const app = express()
app.use(cors()); 

// Middleware global de log para você enxergar no terminal qualquer chamada recebida
app.use((req, res, next) => {
    console.log(`[HTTP Debug] ${req.method} ${req.url}`)
    next()
})

// Direcionamento do Uploads para a raiz do projeto
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const upload = multer({ dest: uploadDir })

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

        console.log('[Server] Conectando ao provedor de fila Redis (BullMQ)...')
        const queueProvider = new BullMqQueueProvider()

        // 3. Instanciação dos Casos de Uso
        const enqueueIngestionUseCase = new EnqueueIngestionUseCase(jobRepo, queueProvider)
        const queryRagUseCase = new QueryRagUseCase(vectorRepo, llmService)

        // 4. Instância dos Controllers
        const ingestController = new IngestController(enqueueIngestionUseCase)
        const checkJobStatusController = new CheckJobStatusController(jobRepo)


        app.post('/api/ingest', upload.single('file'), (req, res) => ingestController.handle(req, res))
        app.get('/api/ingest/status/:jobId', (req, res) => checkJobStatusController.handle(req, res))
        /**
         * POST /api/chat
         */
        app.post('/api/chat', async (req, res) => {
            try {
                const { question } = req.body
                if (!question) {
                    return res.status(400).json({ error: 'Pergunta não informada.' })
                }

                const result = await queryRagUseCase.execute(question)
                return res.status(200).json(result)
            } catch (error: any) {
                return res.status(500).json({ error: error.message })
            }
        })

        // 4. Inicia o Servidor HTTP PRIMEIRO para garantir que a porta escute requisições
        const port = Number(process.env.PORT) || 3000
        app.listen(port, '0.0.0.0', () => {
            console.log(`[Server] Servidor HTTP rodando na porta ${port}`)
        })

    } catch (error) {
        console.error('[Server Error] Falha durante a inicialização do bootstrap:', error)
    }
}

bootstrap()