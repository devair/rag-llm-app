export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export class IngestionJob {
    constructor(
        public readonly id: string,
        public readonly fileName: string,
        public readonly filePath: string,
        public readonly mimeType: string,
        public readonly originalName: string,
        public status: JobStatus,
        public errorMessage?: string,
        public readonly createdAt?: Date,
        public updatedAt?: Date
    ) { }

    markAsProcessing(): void {
        this.status = 'PROCESSING'
        this.updatedAt = new Date()
    }

    markAsCompleted(): void {
        this.status = 'COMPLETED'
        this.updatedAt = new Date()
    }

    markAsFailed(error: string): void {
        this.status = 'FAILED'
        this.errorMessage = error
        this.updatedAt = new Date()
    }
}