import type { ChatResponse } from "../types/api"
import { API_BASE_URL } from "../config/apiConfig"
import { ApiError } from "./ApiError"
import { httpClient } from "./httpClient"
import { consumeSseStream } from "./sse"
import type { IChatService, StreamChatHandlers } from "./interfaces/IChatService"

export class HttpChatService implements IChatService {
    askQuestion(question: string): Promise<ChatResponse> {
        return httpClient.postJson<ChatResponse>('/api/chat', {
            question
        })
    }

    /**
     * Envia a pergunta e consome a resposta via Server-Sent Events (SSE),
     * disparando onToken para cada token gerado pelo modelo.
     */
    async askQuestionStreaming(question: string, handlers: StreamChatHandlers): Promise<void> {
        const { onToken, onSources, signal } = handlers

        const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
            signal
        }).catch(() => {
            throw new ApiError('Falha na comunicação com a API.')
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}) as Record<string, unknown>)
            const message = typeof errorData.error === 'string'
                ? errorData.error
                : `Error ${response.status}`
            throw new ApiError(message, response.status)
        }

        let streamError: string | null = null

        await consumeSseStream(response, (event) => {
            switch (event.event) {
                case 'token': {
                    try {
                        onToken(JSON.parse(event.data) as string)
                    } catch {
                        onToken(event.data)
                    }
                    break
                }
                case 'sources': {
                    try {
                        onSources?.(JSON.parse(event.data) as string[])
                    } catch {
                        /* ignora payload malformado de fontes */
                    }
                    break
                }
                case 'error': {
                    try {
                        const parsed = JSON.parse(event.data) as { error?: string }
                        streamError = parsed.error ?? 'Falha na geração da resposta.'
                    } catch {
                        streamError = 'Falha na geração da resposta.'
                    }
                    break
                }
                case 'done':
                default:
                    break
            }
        }, signal)

        if (streamError) {
            throw new ApiError(streamError)
        }
    }
}