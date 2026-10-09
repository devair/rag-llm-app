import { API_BASE_URL } from "../config/apiConfig"
import { ApiError } from "./ApiError"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response

    try {
        response = await fetch(`${API_BASE_URL}${path}`, init)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}) as Record<string, unknown>)
            const message = typeof errorData.error === 'string' ?
                errorData.error : `Error ${response.status}`
            throw new ApiError(message, response.status)
        }

        return response.json() as Promise<T>

    } catch {
        throw new ApiError('Falha na comunicação com a API.')
    }
}

export const httpClient = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: BodyInit) => request<T>(path, { method: 'POST', body }),
    postJson: <T>(path: string, data: unknown) => request<T>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
}