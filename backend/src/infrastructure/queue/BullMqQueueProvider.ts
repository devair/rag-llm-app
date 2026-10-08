import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'
import { IJobQueueProvider } from '../../domain/interfaces/IIngestionJobRepository'
import { ProcessIngestionJobUseCase } from '../../use-cases/ProcessIngestionJobUseCase'
import * as dotenv from 'dotenv'

dotenv.config()

// Configuração do Redis reutilizável com resiliência para IPv4 e timeouts
export const redisConfig = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
    family: 4, // Força resolução IPv4 no Docker/Node
    maxRetriesPerRequest: null,
    connectTimeout: 5000, // Evita travamento infinito de 5s se o Redis estiver inacessível
    enableOfflineQueue: false,
    retryStrategy(times: number) {
        if (times > 3) {
            console.error('[Redis] Número máximo de tentativas de conexão atingido.')
            return null // Interrompe chamadas em loop infinito
        }
        return Math.min(times * 1000, 3000)
    },
}

// Instância do ioredis para gerenciar conexões de fila
export const redisConnection = new Redis(redisConfig)

redisConnection.on('error', (err) => {
    console.error('[Redis Connection Error]:', err.message)
})

redisConnection.on('connect', () => {
    console.log('[Redis] Conectado com sucesso!')
})

// Definição da Fila no BullMQ
export const ingestionQueue = new Queue('ingestion-queue', {
    connection: redisConnection,
})

ingestionQueue.on('error', (err) => {
    console.error('[BullMQ Queue Error]:', err.message)
})

// Provider para enfileirar tarefas no lado do Servidor HTTP / API
export class BullMqQueueProvider implements IJobQueueProvider {
    async enqueueIngestionJob(jobId: string): Promise<void> {
        await ingestionQueue.add('process-file', { jobId })
    }
}

// Função para Inicialização do Worker em um processo/container separado (worker.ts)
export function setupIngestionWorker(processIngestionJobUseCase: ProcessIngestionJobUseCase) {
    const worker = new Worker(
        'ingestion-queue',
        async (job) => {
            console.log(`[Worker] Iniciando processamento do Job: ${job.data.jobId}`)
            const { jobId } = job.data
            await processIngestionJobUseCase.execute(jobId)
            console.log(`[Worker] Job ${jobId} concluído com sucesso!`)
        },
        { connection: redisConfig }
    )

    worker.on('ready', () => {
        console.log('[BullMQ Worker] Worker conectado e aguardando novos jobs...')
    })

    worker.on('error', (err) => {
        console.error('[BullMQ Worker Error]:', err.message)
    })

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} (JobId: ${job?.data?.jobId}) falhou:`, err)
    })

    return worker
}