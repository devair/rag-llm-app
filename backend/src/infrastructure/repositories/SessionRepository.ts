import { Repository } from "typeorm"
import { Message, Session } from "../../domain/entities/Session"
import { ISessionRepository } from "../../domain/interfaces/ISessionRepository"
import { SessionMessageSchema, SessionSchema } from "../database/entities/SessionSchema"
import { AppDataSource } from "../database/typeorm.config"

export class SessionRepository implements ISessionRepository {
    private repo: Repository<SessionSchema>
    private messageRepo: Repository<SessionMessageSchema>

    constructor() {
        this.repo = AppDataSource.getRepository(SessionSchema)
        this.messageRepo = AppDataSource.getRepository(SessionMessageSchema)
    }

    async findById(id: string): Promise<Session | null> {
        const entity = await this.repo.findOne({ where: { id } })
        return entity ? this.toSession(entity) : null
    }

    async findAll(): Promise<Session[]> {
        const entities = await this.repo.find()
        return entities.map(entity => this.toSession(entity))
    }

    async create(session: Partial<Session>): Promise<Session> {
        if (!session.userId?.trim()) {
            throw new Error("O userId é obrigatório para criar uma sessão.")
        }
        const entity = this.repo.create({
            userId: session.userId?.trim() || "local-user",
            title: session.title?.trim() || "Nova conversa"
        })
        const saved = await this.repo.save(entity)
        return this.toSession(saved)
    }

    async update(session: Partial<Session>): Promise<void> {
        if (!session.id) {
            throw new Error("O id da sessão é obrigatório para atualizar.")
        }
        await this.repo.update(session.id, {
            ...(session.userId !== undefined && { userId: session.userId }),
            ...(session.title !== undefined && { title: session.title })
        })
    }

    async updateTitleIfDefault(sessionId: string, title: string): Promise<boolean> {
        const result = await this.repo
            .createQueryBuilder()
            .update(SessionSchema)
            .set({ title, updatedAt: new Date() })
            .where("id = :sessionId", { sessionId })
            .andWhere("title = :defaultTitle", { defaultTitle: "Nova conversa" })
            .execute()
        return (result.affected ?? 0) > 0
    }

    async delete(id: string): Promise<void> {
        await this.messageRepo.delete({ sessionId: id })
        await this.repo.delete(id)
    }

    async getMessages(sessionId: string): Promise<Message[]> {
        const messages = await this.messageRepo.find({
            where: { sessionId },
            order: { createdAt: "ASC" }
        })
        return messages.map(({ id, role, content, sessionId: messageSessionId }) => ({
            id,
            role,
            content,
            sessionId: messageSessionId
        }))
    }

    async createMessage(
        sessionId: string,
        content: string,
        role: Message["role"]
    ): Promise<Message | null> {
        const session = await this.repo.findOne({ where: { id: sessionId } })
        if (!session) return null

        const message = this.messageRepo.create({ sessionId, content, role })
        const saved = await this.messageRepo.save(message)
        await this.repo.update(sessionId, { updatedAt: new Date() })
        return {
            id: saved.id,
            role: saved.role,
            content: saved.content,
            sessionId: saved.sessionId
        }
    }

    async updateMessage(
        sessionId: string,
        messageId: string,
        content: string,
        role: Message["role"]
    ): Promise<Message | null> {
        const message = await this.messageRepo.findOne({ where: { id: messageId, sessionId } })
        if (!message) return null

        message.content = content
        message.role = role
        const saved = await this.messageRepo.save(message)
        await this.repo.update(sessionId, { updatedAt: new Date() })
        return {
            id: saved.id,
            role: saved.role,
            content: saved.content,
            sessionId: saved.sessionId
        }
    }

    async deleteMessage(sessionId: string, messageId: string): Promise<boolean> {
        const result = await this.messageRepo.delete({ id: messageId, sessionId })
        const deleted = (result.affected ?? 0) > 0
        if (deleted) {
            await this.repo.update(sessionId, { updatedAt: new Date() })
        }
        return deleted
    }

    private toSession(entity: SessionSchema): Session {
        return new Session(entity.id, entity.userId, entity.title, entity.createdAt, entity.updatedAt)
    }
}
