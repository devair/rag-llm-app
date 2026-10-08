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

export interface ChatMessage {
    id: string
    sender: 'user' | 'assistant'
    text: string
    sources?: string[]
    timestamp: Date
}