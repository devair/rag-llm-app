import express from 'express'
import multer from 'multer'
import { initializeDatabase } from '../infrastructure/database/typeorm.config'
import { VectorRepository } from '../infrastructure/repositories/VectorRepository'
import { OllamaService } from '../infrastructure/services/OllamaService'
import { DocumentParserFactory } from '../infrastructure/services/parsers/DocumentParserFactory'
import { IngestDocumentUseCase } from '../use-cases/IngestDocumentUseCase'
import { QueryRagUseCase } from '../use-cases/QueryRagUseCase'
import * as dotenv from 'dotenv'

dotenv.config()

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.use(express.json())

const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434'
const embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'
const chatModel = process.env.OLLAMA_CHAT_MODEL || 'llama3:latest'

async function bootstrap() {
    await initializeDatabase()

    const vectorRepo = new VectorRepository()
    const llmService = new OllamaService(ollamaHost, embeddingModel, chatModel)

    const ingestUseCase = new IngestDocumentUseCase(vectorRepo, llmService)
    const queryRagUseCase = new QueryRagUseCase(vectorRepo, llmService)

    // Endpoint de Upload / Ingestão
    app.post('/api/ingest', upload.single('file'), async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' })

            const text = await DocumentParserFactory.parse(
                req.file.buffer,
                req.file.mimetype,
                req.file.originalname
            )

            await ingestUseCase.execute(text, req.file.originalname)
            return res.status(200).json({ message: 'Documento indexado com sucesso.' })
        } catch (error: any) {
            return res.status(500).json({ error: error.message })
        }
    })

    // Endpoint do Chat RAG
    app.post('/api/chat', async (req, res) => {
        try {
            const { question } = req.body
            if (!question) return res.status(400).json({ error: 'Pergunta não informada.' })

            const result = await queryRagUseCase.execute(question)
            return res.status(200).json(result)
        } catch (error: any) {
            return res.status(500).json({ error: error.message })
        }
    })

    const port = process.env.PORT || 3000
    app.listen(port, () => {
        console.log(`Server rodando na porta ${port}`)
    })
}

bootstrap()