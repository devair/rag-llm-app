import { text } from "node:stream/consumers"
import { DocumentChunk } from "../domain/entities/DocumentChunk"
import { ILLMService } from "../domain/interfaces/ILLMService"
import { IVectorRepository } from "../domain/interfaces/IVectorRepository"

export class IngestDocumentUseCase {

    constructor(
        private vectorRepo: IVectorRepository,
        private llmService: ILLMService
    ) { }

    async execute(fileContent: string, fileName: string): Promise<void> {
        const textChunks = this.splitTextIntoChunks(fileContent, 1000, 200)
        const chunksToSave: DocumentChunk[] = []

        for (const chunkText of textChunks) {
            const embedding = await this.llmService.generateEmbedding(chunkText)
            chunksToSave.push(
                new DocumentChunk('', fileName, chunkText, embedding)
            )
        }

        await this.vectorRepo.saveMany(chunksToSave)
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