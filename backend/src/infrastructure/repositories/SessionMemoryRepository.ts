import { In, Repository } from "typeorm"
import { SessionMemoryEntry, SessionMemoryMatch } from "../../domain/entities/SessionMemory"
import { ISessionMemoryRepository } from "../../domain/interfaces/ISessionMemoryRepository"
import { AppDataSource } from "../database/typeorm.config"
import {
    SessionContextSessionSchema,
    SessionMemoryChunkSchema
} from "../database/entities/SessionMemorySchema"
import { SessionSchema } from "../database/entities/SessionSchema"

export class SessionMemoryRepository implements ISessionMemoryRepository {
    private contextRepo: Repository<SessionContextSessionSchema>
    private memoryRepo: Repository<SessionMemoryChunkSchema>

    constructor() {
        this.contextRepo = AppDataSource.getRepository(SessionContextSessionSchema)
        this.memoryRepo = AppDataSource.getRepository(SessionMemoryChunkSchema)
    }

    async getContextSessionIds(sessionId: string): Promise<string[]> {
        const links = await this.contextRepo.find({ where: { sessionId } })
        return links.map(({ sourceSessionId }) => sourceSessionId)
    }

    async setContextSessionIds(sessionId: string, sourceSessionIds: string[]): Promise<void> {
        await this.contextRepo.manager.transaction(async (manager) => {
            const repository = manager.getRepository(SessionContextSessionSchema)
            await repository.delete({ sessionId })
            if (sourceSessionIds.length > 0) {
                await repository.save(sourceSessionIds.map((sourceSessionId) =>
                    repository.create({ sessionId, sourceSessionId })
                ))
            }
        })
    }

    async getIndexedMessages(sessionIds: string[]): Promise<SessionMemoryEntry[]> {
        if (sessionIds.length === 0) return []
        return this.memoryRepo.find({
            where: { sourceSessionId: In(sessionIds) }
        })
    }

    async saveIndexedMessages(entries: SessionMemoryEntry[]): Promise<void> {
        if (entries.length === 0) return
        await this.memoryRepo.upsert(entries, ["messageId"])
    }

    async deleteIndexedMessagesNotIn(sessionId: string, messageIds: string[]): Promise<void> {
        const query = this.memoryRepo.createQueryBuilder()
            .delete()
            .from(SessionMemoryChunkSchema)
            .where("sourceSessionId = :sessionId", { sessionId })

        if (messageIds.length > 0) {
            query.andWhere("messageId NOT IN (:...messageIds)", { messageIds })
        }
        await query.execute()
    }

    async searchSimilar(
        embedding: number[],
        sourceSessionIds: string[],
        topK: number
    ): Promise<SessionMemoryMatch[]> {
        if (sourceSessionIds.length === 0) return []
        const vector = `[${embedding.join(",")}]`
        const results = await this.memoryRepo.createQueryBuilder("memory")
            .innerJoin(SessionSchema, "session", "session.id = memory.sourceSessionId")
            .select("memory.sourceSessionId", "sessionId")
            .addSelect("session.title", "sessionTitle")
            .addSelect("memory.role", "role")
            .addSelect("memory.content", "content")
            .addSelect("memory.embedding <=> :vector", "distance")
            .where("memory.sourceSessionId IN (:...sourceSessionIds)", { sourceSessionIds })
            .setParameter("vector", vector)
            .orderBy("distance", "ASC")
            .take(topK)
            .getRawMany<SessionMemoryMatch>()

        return results
    }

    async deleteSessionReferences(sessionId: string): Promise<void> {
        await this.contextRepo.delete({ sessionId })
        await this.contextRepo.delete({ sourceSessionId: sessionId })
        await this.memoryRepo.delete({ sourceSessionId: sessionId })
    }
}
