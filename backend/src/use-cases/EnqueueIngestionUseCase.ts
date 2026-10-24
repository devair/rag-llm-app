import { v4 as uuidv4 } from "uuid"
import { IngestionJob } from "../domain/entities/IngestionJob"
import { IIngestionJobRepository, IJobQueueProvider } from "../domain/interfaces/IIngestionJobRepository"

export class EnqueueIngestionUseCase {

    constructor(
        private readonly jobRepo: IIngestionJobRepository,
        private readonly queueProvider: IJobQueueProvider
    ) { }

    async execute(fileName: string, tempFilePath: string, mimeType: string, originalName: string): Promise<{ jobId: string }> {
        const jobId = uuidv4()
        const job = new IngestionJob(jobId, fileName, tempFilePath, mimeType,originalName, 'PENDING')

        await this.jobRepo.create(job)

        try {
            await this.queueProvider.enqueueIngestionJob(jobId)
        } catch (error) {
            job.markAsFailed(error instanceof Error ? error.message : 'Falha ao adicionar job à fila.')
            await this.jobRepo.update(job)
            throw error
        }

        return { jobId }
    }
}