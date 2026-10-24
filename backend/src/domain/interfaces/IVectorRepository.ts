import { DocumentChunk } from "../entities/DocumentChunk"
import { KnowledgeDocument } from "../entities/KnowledgeDocument"

export interface IVectorRepository {
    saveMany(chunks: DocumentChunk[]): Promise<void>
    searchSimilar(embedding: number[], topK: number): Promise<DocumentChunk[]>
    listDocuments(): Promise<KnowledgeDocument[]>
    deleteDocument(documentName: string): Promise<boolean>
}