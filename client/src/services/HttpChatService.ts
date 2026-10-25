import { httpClient } from "./httpClient"
import type { IChatService } from "./interfaces/IChatService"

export class HttpChatService implements IChatService {
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