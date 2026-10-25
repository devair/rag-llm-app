export interface IChatService {
    streamQuestion(
        question: string,
        onToken: (token: string) => void,
        onSources: (sources: string[]) => void,
        sessionId?: string
    ): Promise<void>
}