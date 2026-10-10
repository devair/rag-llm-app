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
}