import type { ChatResponse } from "../types/api"
import { httpClient } from "./httpClient"
import type { IChatService } from "./interfaces/IChatService"

export class HttpChatService implements IChatService {
    askQuestion(question: string, sessionId?: string): Promise<ChatResponse> {
        return httpClient.postJson<ChatResponse>('/api/chat', {
            question,
            ...(sessionId && { sessionId })
        })
    }

    streamQuestion(
        question: string,
        onToken: (token: string) => void,
        onSources: (sources: string[]) => void,
        sessionId?: string
    ): Promise<void> {
        return httpClient.stream(
            '/api/chat/stream',
            { question, ...(sessionId && { sessionId }) },
            onToken,
            onSources
        )
    }
}