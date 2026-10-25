export interface IngestResponse {
    message: string
    jobId: string
    statusUrl: string
}

export interface KnowledgeDocument {
    documentName: string
    chunkCount: number
    createdAt: string
}

export type JobStatusType = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface JobStatusResponse {
    jobId: string
    fileName?: string
    status: JobStatusType
    errorMessage?: string | null
    updatedAt?: string
}

export interface ChatMessage {
    id: string
    sender: 'user' | 'assistant'
    text: string
    sources?: string[]
    timestamp: Date
}

export interface Session {
    id: string
    userId: string
    title: string
    createdAt: string
    updatedAt: string
}

export interface SessionMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    sessionId: string
}