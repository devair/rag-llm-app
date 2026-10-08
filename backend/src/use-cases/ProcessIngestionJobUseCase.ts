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
            // const fileContent = await fs.readFile(job.filePath, 'utf-8')
            const fileBuffer = await fs.readFile(job.filePath) 
            
            const text = await DocumentParserFactory.parse(
                fileBuffer,
                job.mimeType as string,
                job.originalName as string
            )

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

            // 4. Limpa o arquivo temporário do disco
            await fs.unlink(job.filePath).catch(() => null)

            // 5. Atualiza o status do Job para COMPLETED
            job.markAsCompleted()
            await this.jobRepo.update(job)

        } catch (error: any) {
            job.markAsFailed(error?.message || 'Erro desconhecido durante o processamento.')
            await this.jobRepo.update(job)

            await fs.unlink(job.filePath).catch(() => null)
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