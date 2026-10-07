import { Request, Response } from "express"
import { IngestionJobRepository } from "../../repositories/IngestionJobRepository"

// CheckJobStatusController.ts
export class CheckJobStatusController {
    constructor(private jobRepository: IngestionJobRepository) { }

    async handle(req: Request, res: Response): Promise<Response> {
        try {
            const { jobId } = req.params
            const job = await this.jobRepository.findById(jobId as string)

            if (!job) {
                return res.status(404).json({ error: 'Job não encontrado.' })
            }

            // Retorna apenas os dados salvos na tabela do banco
            return res.status(200).json({
                id: job.id,
                status: job.status,
                error: job.errorMessage || null,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt
            })
        } catch (error: any) {
            return res.status(500).json({ error: error.message })
        }
    }
}