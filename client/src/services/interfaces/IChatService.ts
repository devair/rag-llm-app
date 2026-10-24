import type { ChatResponse } from "../../types/api"

export interface IChatService {
    askQuestion(question: string, sessionId?: string): Promise<ChatResponse>
    streamQuestion(
        question: string,
        onToken: (token: string) => void,
        onSources: (sources: string[]) => void,
        sessionId?: string
    ): Promise<void>
}