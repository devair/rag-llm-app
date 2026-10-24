import { Repository } from "typeorm"
import { DocumentChunkSchema } from "../database/entities/DocumentChunkSchema"
import { AppDataSource } from "../database/typeorm.config"
import { IVectorRepository } from "../../domain/interfaces/IVectorRepository"
import { DocumentChunk } from "../../domain/entities/DocumentChunk"
import { KnowledgeDocument } from "../../domain/entities/KnowledgeDocument"


export class VectorRepository implements IVectorRepository {
    private repo: Repository<DocumentChunkSchema>

    constructor() {
        this.repo = AppDataSource.getRepository(DocumentChunkSchema)
    }

    async saveMany(chunks: DocumentChunk[]): Promise<void> {
        const entities = chunks.map(chunk => {
            const entity = new DocumentChunkSchema()
            entity.documentName = chunk.documentName
            entity.content = chunk.content
            entity.embedding = chunk.embedding
            return entity
        })

        await this.repo.save(entities)
    }

    async searchSimilar(embedding: number[], topK: number): Promise<DocumentChunk[]> {
        const vectorString = `[${embedding.join(',')}]`

        const results = await this.repo
            .createQueryBuilder('chunk')
            .select(['chunk.id', 'chunk.documentName', 'chunk.content', 'chunk.createdAt'])
            .orderBy('chunk.embedding <=> :vector', 'ASC')
            .setParameter('vector', vectorString)
            .take(topK)
            .getMany();

        return results.map(
            r => new DocumentChunk(r.id, r.documentName, r.content, [], r.createdAt)
        )
    }

    async listDocuments(): Promise<KnowledgeDocument[]> {
        const documents = await this.repo
            .createQueryBuilder("chunk")
            .select("chunk.documentName", "documentName")
            .addSelect("COUNT(chunk.id)", "chunkCount")
            .addSelect("MIN(chunk.createdAt)", "createdAt")
            .groupBy("chunk.documentName")
            .orderBy("chunk.documentName", "ASC")
            .getRawMany<{ documentName: string; chunkCount: string; createdAt: string | Date }>()

        return documents.map((document) => ({
            documentName: document.documentName,
            chunkCount: Number(document.chunkCount),
            createdAt: document.createdAt instanceof Date
                ? document.createdAt
                : new Date(document.createdAt)
        }))
    }

    async deleteDocument(documentName: string): Promise<boolean> {
        const result = await this.repo.delete({ documentName })
        return (result.affected ?? 0) > 0
    }
}