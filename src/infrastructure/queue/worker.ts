import dotenv from 'dotenv'
import { ProcessIngestionJobUseCase } from '../../use-cases/ProcessIngestionJobUseCase'
import { initializeDatabase } from '../database/typeorm.config'
import { IngestionJobRepository } from '../repositories/IngestionJobRepository'
import { VectorRepository } from '../repositories/VectorRepository'
import { OllamaService } from '../services/OllamaService'
import { setupIngestionWorker } from './BullMqQueueProvider'

dotenv.config()

const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434'
const embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'
const chatModel = process.env.OLLAMA_CHAT_MODEL || 'llama3:latest'

async function bootstrapWorker() {
    console.log('[Worker] Conectando ao banco de dados...')
    await initializeDatabase()

    const vectorRepo = new VectorRepository()
    const jobRepo = new IngestionJobRepository()
    const llmService = new OllamaService(ollamaHost, embeddingModel, chatModel)

    // Instancia o caso de uso que faz o trabalho pesado (parsing, embeddings e pgvector)
    const processIngestionJobUseCase = new ProcessIngestionJobUseCase(
        jobRepo,
        vectorRepo,
        llmService
    )

    // Inicializa a escuta da fila do BullMQ no container do worker
    setupIngestionWorker(processIngestionJobUseCase)
    console.log('[Worker] Processo de background ativo e aguardando novas tarefas na fila.')
}

bootstrapWorker().catch((err) => {
    console.error('[Worker] Erro ao inicializar o worker:', err)
    process.exit(1)
})