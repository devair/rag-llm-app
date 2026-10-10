import { Request, Response } from "express"
import { QueryRagUseCase } from "../../../use-cases/QueryRagUseCase"


export class ChatController {
    constructor(
        private readonly queryRagUseCase: QueryRagUseCase
    ) { }

    async handle(req: Request, res: Response): Promise<Response> {
        try {
            const { question, chatHistory } = req.body
            if (!question) {
                return res.status(400).json({ error: 'Pergunta não informada.' })
            }

            const result = await this.queryRagUseCase.execute(question)
            return res.status(200).json(result)
        } catch (error: any) {
            return res.status(500).json({ error: error.message })
        }
    }

    /**
     * Chat com streaming via Server-Sent Events (SSE).
     * Eventos emitidos:
     *  - "sources": lista de documentos recuperados pelo RAG (JSON)
     *  - "token":   cada token gerado pelo LLM (string JSON-encoded)
     *  - "done":    sinaliza o fim da geração
     */
    async handleStream(req: Request, res: Response): Promise<Response> {
        const { question } = req.body ?? {}
        if (!question) {
            return res.status(400).json({ error: 'Pergunta não informada.' })
        }

        // Cabeçalhos padrão de SSE — sem buffering em proxies/nginx.
        res.status(200)
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache, no-transform')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders()

        // Mantém a conexão viva enquanto o modelo "pensa" (a cada 15s).
        const keepAlive = setInterval(() => res.write(': ping\n\n'), 15_000)

        // Se o cliente fechar o navegador/aba, encerra o stream.
        req.on('close', () => {
            clearInterval(keepAlive)
            res.end()
        })

        try {
            for await (const event of this.queryRagUseCase.executeStream(question)) {
                res.write(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`)
            }
        } catch (error: any) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message ?? 'Falha na geração' })}\n\n`)
        } finally {
            clearInterval(keepAlive)
            res.end()
        }

        return res
    }
}