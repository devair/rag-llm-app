export interface ChatResponse {
    answer: string
    sources?: string[]
}

export interface IngestResponse {
    message: string
    jobId: string
    statusUrl: string
}

export type JobStatusType = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface JobStatusResponse {
    jobId: string
    fileName?: string
    status: JobStatusType
    errorMessage?: string | null
    updatedAt: string
}

// Interface para streaming de resposta
export interface ChatStreamData {
    chunk: string
    total: number
}
