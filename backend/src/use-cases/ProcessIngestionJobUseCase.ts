import * as fs from 'fs/promises'
import { IIngestionJobRepository } from "../domain/interfaces/IIngestionJobRepository"
import { ILLMService } from "../domain/interfaces/ILLMService"
import { IVectorRepository } from "../domain/interfaces/IVectorRepository"
import { DocumentChunk } from '../domain/entities/DocumentChunk'
import { DocumentParserFactory } from '../infrastructure/services/parsers/DocumentParserFactory'

export class ProcessIngestionJobUseCase {
    constructor(
        private readonly jobRepo: IIngestionJobRepository,
        private readonly vectorRepo: IVectorRepository,
        private readonly llmService: ILLMService
    ) { }

    async execute(jobId: string): Promise<void> {
        const job = await this.jobRepo.findById(jobId)
        if (!job) throw new Error(`Job ${jobId} not found.`)

        try {
            // Atualiza status para PROCESSING
            job.markAsProcessing()
            await this.jobRepo.update(job)

            // 1. Lê o arquivo temporário salvo no upload
            const fileBuffer = await fs.readFile(job.filePath)

            const text = await DocumentParserFactory.parse(
                fileBuffer,
                job.mimeType,
                job.originalName
            )
            if (!text.trim()) {
                throw new Error('O arquivo não contém texto para indexar.')
            }

            const textChunks = this.splitTextIntoChunks(text, 1000, 200)
            const chunksToSave: DocumentChunk[] = []

            for (const chunkText of textChunks) {
                const embedding = await this.llmService.generateEmbedding(chunkText)
                chunksToSave.push(
                    new DocumentChunk('', job.fileName, chunkText, embedding)
                )
            }

            // 3. Salva os chunks e seus embeddings no PGVector
            await this.vectorRepo.saveMany(chunksToSave)

            // Atualiza o status do Job para COMPLETED
            job.markAsCompleted()
            await this.jobRepo.update(job)

        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Erro desconhecido durante o processamento.'
            job.markAsFailed(message)
            try {
                await this.jobRepo.update(job)
            } catch (updateError) {
                console.error(`[ProcessIngestionJobUseCase] Falha ao persistir status do job ${jobId}:`, updateError)
                throw new AggregateError(
                    [error, updateError],
                    `O processamento do job ${jobId} falhou e seu status não pôde ser atualizado.`
                )
            }

            throw error
        } finally {
            try {
                await fs.unlink(job.filePath)
            } catch (cleanupError) {
                const isMissingFile =
                    typeof cleanupError === 'object' &&
                    cleanupError !== null &&
                    'code' in cleanupError &&
                    cleanupError.code === 'ENOENT'
                if (!isMissingFile) {
                    console.error(`[ProcessIngestionJobUseCase] Falha ao remover arquivo temporário do job ${jobId}:`, cleanupError)
                }
            }
        }

    }

    private splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
        const chunks: string[] = []
        let start = 0

        while (start < text.length) {
            const end = start + chunkSize
            chunks.push(text.slice(start, end).trim())
            start += chunkSize - overlap
        }

        return chunks.filter(c => c.length > 0)
    }
}