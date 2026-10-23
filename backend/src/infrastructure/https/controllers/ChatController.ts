import { Request, Response } from "express"
import { QueryRagUseCase } from "../../../use-cases/QueryRagUseCase"

export class ChatController {
    constructor(private readonly queryRagUseCase: QueryRagUseCase) {}

    async handle(
        req: Request,
        res: Response
    ): Promise<Response> {
        try {
            const question = req.body?.question
            
            if (typeof question !== 'string' || !question.trim()) {
                return res.status(400).json({ error: 'Pergunta não informada.' })
            }

            const result = await this.queryRagUseCase.execute(question.trim())
            return res.status(200).json(result)
        } catch (error) {
            console.error('[ChatController] Falha ao processar pergunta:', error)
            const message = error instanceof Error ? error.message : 'Erro interno ao processar pergunta.'
            return res.status(500).json({ error: message })
        }
    }

    async handleStream(req: Request, res: Response): Promise<void> {
        const question = req.body?.question

        if (typeof question !== 'string' || !question.trim()) {
            res.status(400).json({ error: 'Pergunta não informada.' })
            return
        }

        try {
            const { sources, answerStream } = await this.queryRagUseCase.executeStream(question.trim())

            res.status(200)
            res.set({
                'Content-Type': 'application/x-ndjson; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'X-Accel-Buffering': 'no'
            })
            res.flushHeaders()

            for await (const token of answerStream) {
                if (res.destroyed || res.writableEnded) return
                res.write(`${JSON.stringify({ type: 'token', token })}\n`)
            }

            if (!res.destroyed && !res.writableEnded) {
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
