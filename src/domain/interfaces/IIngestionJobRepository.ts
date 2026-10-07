import { IngestionJob } from "../entities/IngestionJob"

export interface IIngestionJobRepository {
    create(job: IngestionJob): Promise<void>
    update(job: IngestionJob): Promise<void>
    findById(id: string): Promise<IngestionJob | null>
}

export interface IJobQueueProvider {
    enqueueIngestionJob(jobId: string): Promise<void>
}