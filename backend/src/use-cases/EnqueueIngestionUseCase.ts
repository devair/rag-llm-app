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

        await this.queueProvider.enqueueIngestionJob(jobId)

        return { jobId }
    }
}