import type { ChatResponse } from "../../types/api"

export interface IChatService {
    askQuestion(question: string): Promise<ChatResponse>
}