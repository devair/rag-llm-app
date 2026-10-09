import type { IngestResponse, JobStatusResponse } from "../types/api"
import { httpClient } from "./httpClient"
import type { IIngestionService } from "./interfaces/IIngestionService"

export class HttpIngestionService implements IIngestionService {

    uploadDocument(file: File): Promise<IngestResponse> {
        const formData = new FormData()
        formData.append('file', file)

        return httpClient.post<IngestResponse>('/api/ingest', formData)

    }
    getJobStatus(jobId: string): Promise<JobStatusResponse> {
        return httpClient.get<JobStatusResponse>(`/api/ingest/status/${jobId}`)
    }
}