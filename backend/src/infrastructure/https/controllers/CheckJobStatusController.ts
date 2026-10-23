import { Request, Response } from "express"
import { IIngestionJobRepository } from "../../../domain/interfaces/IIngestionJobRepository"

// CheckJobStatusController.ts
export class CheckJobStatusController {
    constructor(private jobRepository: IIngestionJobRepository) { }

    async handle(req: Request, res: Response): Promise<Response> {
        try {
            const { jobId } = req.params
            const job = await this.jobRepository.findById(jobId as string)

            if (!job) {
                return res.status(404).json({ error: 'Job não encontrado.' })
            }

            return res.status(200).json({
                jobId: job.id,
                fileName: job.originalName,
                status: job.status,
                errorMessage: job.errorMessage || null,
                updatedAt: job.updatedAt ?? job.createdAt
            })
        } catch (error: any) {
            return res.status(500).json({ error: error.message })
        }
    }
}