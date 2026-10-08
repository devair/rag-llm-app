import { Request, Response } from "express"
import { EnqueueIngestionUseCase } from "../../../use-cases/EnqueueIngestionUseCase"

export class IngestController {
    constructor(
        private readonly enqueueIngestionUseCase: EnqueueIngestionUseCase
    ) { }

    async handle(req: Request, res: Response): Promise<Response> {
        try {
            const file = req.file

            if (!file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' })
            }

            const result = await this.enqueueIngestionUseCase.execute(
                file.originalname,
                file.path,
                file.mimetype,
                file.originalname
            )

            return res.status(202).json({
                message: 'Arquivo recebido com sucesso. O processamento foi iniciado em segundo plano.',
                jobId: result.jobId,
                statusUrl: `/api/ingest/status/${result.jobId}`
            })

        } catch (error: any) {
            return res.status(500).json({ error: error.message })
        }
    }
}