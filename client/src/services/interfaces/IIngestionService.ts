import type { IngestResponse, JobStatusResponse } from "../../types/api"

export interface IIngestionService {
    uploadDocument(file: File): Promise<IngestResponse>
    getJobStatus(jobId: string): Promise<JobStatusResponse>
}