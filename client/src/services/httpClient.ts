import { API_BASE_URL } from "../config/apiConfig"
import { ApiError } from "./ApiError"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response

    try {
        response = await fetch(`${API_BASE_URL}${path}`, init)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}) as Record<string, unknown>)
            const message = typeof errorData.error === "string" ?
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
    }),
    stream: async (
        path: string,
        data: unknown,
        onToken: (token: string) => void,
        onSources: (sources: string[]) => void
    ): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/x-ndjson'
            },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})) as { error?: unknown }
            const message = typeof errorData.error === 'string'
                ? errorData.error
                : `Error ${response.status}`
            throw new ApiError(message, response.status)
        }

        if (!response.body) {
            throw new ApiError('A resposta de streaming não está disponível.')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let pending = ''
        let completed = false

        const processLine = (line: string) => {
            if (!line.trim()) return

            let event: unknown
            try {
                event = JSON.parse(line)
            } catch {
                throw new ApiError('A API retornou um evento de streaming inválido.')
            }

            if (typeof event !== 'object' || event === null || !('type' in event) || typeof event.type !== 'string') {
                throw new ApiError('A API retornou um evento de streaming desconhecido.')
            }

            switch (event.type) {
                case 'token':
                    if (!('token' in event) || typeof event.token !== 'string') {
                        throw new ApiError('A API retornou um token de streaming inválido.')
                    }
                    onToken(event.token)
                    break
                case 'sources':
                    if (
                        !('sources' in event) ||
                        !Array.isArray(event.sources) ||
                        !event.sources.every((source): source is string => typeof source === 'string')
                    ) {
                        throw new ApiError('A API retornou fontes inválidas.')
                    }
                    onSources(event.sources)
                    break
                case 'error':
                    if (!('message' in event) || typeof event.message !== 'string') {
                        throw new ApiError('A API retornou um erro de streaming inválido.')
                    }
                    throw new ApiError(event.message)
                case 'done':
                    completed = true
                    break
                default:
                    throw new ApiError('A API retornou um evento de streaming desconhecido.')
            }
        }

        try {
            while (true) {
                const { done, value } = await reader.read()
                pending += decoder.decode(value, { stream: !done })

                const lines = pending.split('\n')
                pending = lines.pop() ?? ''
                for (const line of lines) {
                    processLine(line)
                }

                if (done) break
            }

            if (pending.trim()) processLine(pending)
            if (!completed) {
                throw new ApiError('A resposta de streaming foi encerrada antes da conclusão.')
            }
        } finally {
            reader.releaseLock()
        }
    }
}