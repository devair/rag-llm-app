import type { ChatResponse } from "../types/api"
import { httpClient } from "./httpClient"
import type { IChatService } from "./interfaces/IChatService"

export class HttpChatService implements IChatService {
    askQuestion(question: string): Promise<ChatResponse> {
        return httpClient.postJson<ChatResponse>('/api/chat', {
            question
        })
    }

}