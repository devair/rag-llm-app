
export class ApiError extends Error {
    readonly status: number

    constructor(message: string, status = 0) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}