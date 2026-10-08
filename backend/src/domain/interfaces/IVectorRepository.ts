import { DocumentChunk } from "../entities/DocumentChunk"

export interface IVectorRepository {
    saveMany(chunks: DocumentChunk[]): Promise<void>
    searchSimiliar(embedding: number[], topK: number): Promise<DocumentChunk[]>
}