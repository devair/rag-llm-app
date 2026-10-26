import { Request, Response } from "express"
import { CreateSessionUseCase } from "../../../use-cases/CreateSessionUseCase"
import { CreateSessionMessageUseCase } from "../../../use-cases/CreateSessionMessageUseCase"
import { DeleteSessionMessageUseCase } from "../../../use-cases/DeleteSessionMessageUseCase"
import { DeleteSessionUseCase } from "../../../use-cases/DeleteSessionUseCase"
import { GetSessionHistoryUseCase } from "../../../use-cases/GetSessionHistoryUseCase"
import { ListSessionsUseCase } from "../../../use-cases/ListSessionsUseCase"
import { UpdateSessionMessageUseCase } from "../../../use-cases/UpdateSessionMessageUseCase"
import {
    SessionContextValidationError,
    UpdateSessionContextUseCase
} from "../../../use-cases/UpdateSessionContextUseCase"

export class SessionController {
    constructor(
        private readonly createSessionUseCase: CreateSessionUseCase,
        private readonly createSessionMessageUseCase: CreateSessionMessageUseCase,
        private readonly getHistoryUseCase: GetSessionHistoryUseCase,
        private readonly listSessionsUseCase: ListSessionsUseCase,
        private readonly updateSessionMessageUseCase: UpdateSessionMessageUseCase,
        private readonly deleteSessionMessageUseCase: DeleteSessionMessageUseCase,
        private readonly deleteSessionUseCase: DeleteSessionUseCase,
        private readonly updateSessionContextUseCase: UpdateSessionContextUseCase
    ) {}

    async create(req: Request, res: Response): Promise<Response> {
        try {
            const requestedUserId = req.body?.userId
            if (requestedUserId !== undefined &&
                (typeof requestedUserId !== "string" || !requestedUserId.trim())) {
                return res.status(400).json({ error: "userId inválido." })
            }

            const userId = typeof requestedUserId === "string" ? requestedUserId.trim() : "local-user"
            const session = await this.createSessionUseCase.execute(userId)
            return res.status(201).json({
                id: session.id,
                sessionId: session.id,
                userId: session.userId,
                title: session.title,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            })
        } catch (error) {
            console.error("[SessionController] Falha ao criar sessão:", error)
            const message = error instanceof Error ? error.message : "Erro interno ao criar sessão."
            return res.status(500).json({ error: message })
        }
    }

    async list(_req: Request, res: Response): Promise<Response> {
        try {
            const sessions = await this.listSessionsUseCase.execute()
            return res.status(200).json(sessions)
        } catch (error) {
            console.error("[SessionController] Falha ao listar sessões:", error)
            const message = error instanceof Error ? error.message : "Erro interno ao listar sessões."
            return res.status(500).json({ error: message })
        }
    }

    async getHistory(req: Request, res: Response): Promise<Response> {
        const { sessionId } = req.params
        if (!sessionId) {
            return res.status(400).json({ error: "sessionId não informado." })
        }
        try {
            const messages = await this.getHistoryUseCase.execute(sessionId as string)
            if (!messages) {
                return res.status(404).json({ error: "Sessão não encontrada." })
            }
            return res.status(200).json(messages)
        } catch (error) {
            console.error("[SessionController] Falha ao buscar histórico:", error)
            const message = error instanceof Error ? error.message : "Erro interno ao buscar histórico."
            return res.status(500).json({ error: message })
        }
    }

    async getContextSessions(req: Request, res: Response): Promise<Response> {
        const { sessionId } = req.params
        if (typeof sessionId !== "string" || !sessionId.trim()) {
            return res.status(400).json({ error: "sessionId não informado." })
        }

        try {
            const sourceSessionIds = await this.updateSessionContextUseCase.get(sessionId.trim())
            if (!sourceSessionIds) {
                return res.status(404).json({ error: "Sessão não encontrada." })
            }
            return res.status(200).json({ sessionIds: sourceSessionIds })
        } catch (error) {
            console.error("[SessionController] Falha ao buscar sessões de contexto:", error)
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao buscar sessões de contexto."
            return res.status(500).json({ error: message })
        }
    }

    async updateContextSessions(req: Request, res: Response): Promise<Response> {
        const { sessionId } = req.params
        const { sessionIds } = req.body ?? {}
        if (typeof sessionId !== "string" || !sessionId.trim() || !Array.isArray(sessionIds) ||
            !sessionIds.every((id: unknown) => typeof id === "string" && id.trim())) {
            return res.status(400).json({ error: "sessionId e uma lista válida de sessionIds são obrigatórios." })
        }

        try {
            const updatedSessionIds = await this.updateSessionContextUseCase.update(
                sessionId.trim(),
                sessionIds.map((id: string) => id.trim())
            )
            if (!updatedSessionIds) {
                return res.status(404).json({ error: "Sessão não encontrada." })
            }
            return res.status(200).json({ sessionIds: updatedSessionIds })
        } catch (error) {
            console.error("[SessionController] Falha ao atualizar sessões de contexto:", error)
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao atualizar sessões de contexto."
            return res.status(error instanceof SessionContextValidationError ? 400 : 500)
                .json({ error: message })
        }
    }

    async createMessage(req: Request, res: Response): Promise<Response> {
        const { sessionId } = req.params
        const { content, role } = req.body ?? {}
        if (!sessionId || typeof content !== "string" || !content.trim() ||
            (role !== "user" && role !== "assistant")) {
            return res.status(400).json({ error: "sessionId, content e role válidos são obrigatórios." })
        }

        try {
            const message = await this.createSessionMessageUseCase.execute(
                sessionId as string,
                content.trim(),
                role
            )
            if (!message) {
                return res.status(404).json({ error: "Sessão não encontrada." })
            }

            return res.status(201).json({ message })
        } catch (error) {
            console.error("[SessionController] Falha ao criar mensagem:", error)
            const message = error instanceof Error ? error.message : "Erro interno ao criar mensagem."
            return res.status(500).json({ error: message })
        }
    }

    async updateMessage(req: Request, res: Response): Promise<Response> {
        const { sessionId, messageId } = req.params
        const { content, role } = req.body ?? {}
        if (!sessionId || !messageId || typeof content !== "string" || !content.trim() ||
            (role !== "user" && role !== "assistant")) {
            return res.status(400).json({ error: "sessionId, messageId, content e role válidos são obrigatórios." })
        }

        try {
            const message = await this.updateSessionMessageUseCase.execute(
                sessionId as string,
                messageId as string,
                content.trim(),
                role
            )
            if (!message) {
                return res.status(404).json({ error: "Mensagem não encontrada." })
            }

            return res.status(200).json({ message })
        } catch (error) {
            console.error("[SessionController] Falha ao atualizar mensagem:", error)
            const message = error instanceof Error ? error.message : "Erro interno ao atualizar mensagem."
            return res.status(500).json({ error: message })
        }
    }

    async deleteMessage(req: Request, res: Response): Promise<Response> {
        const { sessionId, messageId } = req.params
        if (!sessionId || !messageId) {
            return res.status(400).json({ error: "sessionId e messageId são obrigatórios." })
        }

        try {
            const deleted = await this.deleteSessionMessageUseCase.execute(sessionId as string, messageId as string)
            if (!deleted) {
                return res.status(404).json({ error: "Mensagem não encontrada." })
            }

            return res.status(200).json({ message: "Mensagem deletada." })
        } catch (error) {
            console.error("[SessionController] Falha ao deletar mensagem:", error)
            const message = error instanceof Error ? error.message : "Erro interno ao deletar mensagem."
            return res.status(500).json({ error: message })
        }
    }

    async delete(req: Request, res: Response): Promise<Response> {
        const { sessionId } = req.params
        if (!sessionId) {
            return res.status(400).json({ error: "sessionId não informado." })
        }

        try {
            const deleted = await this.deleteSessionUseCase.execute(sessionId as string)
            if (!deleted) {
                return res.status(404).json({ error: "Sessão não encontrada." })
            }

            return res.status(200).json({ message: "Sessão deletada." })
        } catch (error) {
            console.error("[SessionController] Falha ao deletar sessão:", error)
            const message = error instanceof Error ? error.message : "Erro interno ao deletar sessão."
            return res.status(500).json({ error: message })
        }
    }
}
