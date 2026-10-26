import { Request, Response } from "express"
import type { Message } from "../../../domain/entities/Session"
import { CreateSessionMessageUseCase } from "../../../use-cases/CreateSessionMessageUseCase"
import { QueryRagUseCase } from "../../../use-cases/QueryRagUseCase"
import { UpdateSessionTitleUseCase } from "../../../use-cases/UpdateSessionTitleUseCase"

export class ChatController {
    constructor(
        private readonly queryRagUseCase: QueryRagUseCase,
        private readonly createSessionMessageUseCase: CreateSessionMessageUseCase,
        private readonly updateSessionTitleUseCase: UpdateSessionTitleUseCase
    ) {}

    private getSessionId(req: Request): string | undefined | null {
        const sessionId = req.body?.sessionId
        if (sessionId === undefined) return undefined
        if (typeof sessionId !== "string" || !sessionId.trim()) return null
        return sessionId.trim()
    }

    private async saveMessage(
        sessionId: string | undefined,
        content: string,
        role: Message["role"]
    ): Promise<boolean> {
        if (!sessionId) return true
        return (await this.createSessionMessageUseCase.execute(sessionId, content, role)) !== null
    }

    private async updateSessionTitle(sessionId: string | undefined, question: string): Promise<void> {
        if (!sessionId) return
        const normalizedQuestion = question.replace(/\s+/g, " ").trim()
        const title = normalizedQuestion.length > 60
            ? `${normalizedQuestion.slice(0, 57).trimEnd()}...`
            : normalizedQuestion
        await this.updateSessionTitleUseCase.execute(sessionId, title)
    }

    async handle(
        req: Request,
        res: Response
    ): Promise<Response> {
        try {
            const question = req.body?.question
            const sessionId = this.getSessionId(req)
            
            if (typeof question !== 'string' || !question.trim()) {
                return res.status(400).json({ error: 'Pergunta não informada.' })
            }
            if (sessionId === null) {
                return res.status(400).json({ error: 'sessionId inválido.' })
            }
            if (!(await this.saveMessage(sessionId, question.trim(), "user"))) {
                return res.status(404).json({ error: 'Sessão não encontrada.' })
            }
            await this.updateSessionTitle(sessionId, question)

            const result = await this.queryRagUseCase.execute(question.trim(), sessionId)
            if (!(await this.saveMessage(sessionId, result.answer, "assistant"))) {
                return res.status(404).json({ error: 'Sessão não encontrada.' })
            }
            return res.status(200).json(result)
        } catch (error) {
            console.error('[ChatController] Falha ao processar pergunta:', error)
            const message = error instanceof Error ? error.message : 'Erro interno ao processar pergunta.'
            return res.status(500).json({ error: message })
        }
    }

    async handleStream(req: Request, res: Response): Promise<void> {
        const question = req.body?.question
        const sessionId = this.getSessionId(req)

        if (typeof question !== 'string' || !question.trim()) {
            res.status(400).json({ error: 'Pergunta não informada.' })
            return
        }
        if (sessionId === null) {
            res.status(400).json({ error: 'sessionId inválido.' })
            return
        }

        try {
            if (!(await this.saveMessage(sessionId, question.trim(), "user"))) {
                res.status(404).json({ error: 'Sessão não encontrada.' })
                return
            }
            await this.updateSessionTitle(sessionId, question)

            const { sources, answerStream } = await this.queryRagUseCase.executeStream(
                question.trim(),
                sessionId
            )

            res.status(200)
            res.set({
                'Content-Type': 'application/x-ndjson; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'X-Accel-Buffering': 'no'
            })
            res.flushHeaders()

            let answer = ""
            for await (const token of answerStream) {
                if (res.destroyed || res.writableEnded) return
                answer += token
                res.write(`${JSON.stringify({ type: 'token', token })}\n`)
            }

            if (!res.destroyed && !res.writableEnded) {
                if (!(await this.saveMessage(sessionId, answer, "assistant"))) {
                    res.write(`${JSON.stringify({ type: 'error', message: 'Sessão não encontrada.' })}\n`)
                    res.end()
                    return
                }
                res.write(`${JSON.stringify({ type: 'sources', sources })}\n`)
                res.write(`${JSON.stringify({ type: 'done' })}\n`)
                res.end()
            }
        } catch (error) {
            console.error('[ChatController] Falha no streaming da resposta:', error)
            if (res.headersSent) {
                if (!res.destroyed && !res.writableEnded) {
                    const message = error instanceof Error ? error.message : 'Erro interno ao gerar resposta.'
                    res.write(`${JSON.stringify({ type: 'error', message })}\n`)
                    res.end()
                }
                return
            }

            const message = error instanceof Error ? error.message : 'Erro interno ao gerar resposta.'
            res.status(500).json({ error: message })
        }
    }
}
