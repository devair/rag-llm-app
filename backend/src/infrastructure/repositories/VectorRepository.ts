import { Repository } from "typeorm"
import { DocumentChunkSchema } from "../database/entities/DocumentChunkSchema"
import { AppDataSource } from "../database/typeorm.config"
import { IVectorRepository } from "../../domain/interfaces/IVectorRepository"
import { DocumentChunk } from "../../domain/entities/DocumentChunk"


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

    async searchSimiliar(embedding: number[], topK: number): Promise<DocumentChunk[]> {
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
}