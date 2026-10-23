import type { ChatResponse } from "../../types/api"

export interface IChatService {
    askQuestion(question: string): Promise<ChatResponse>
    streamQuestion(
        question: string,
        onToken: (token: string) => void,
        onSources: (sources: string[]) => void
    ): Promise<void>
}