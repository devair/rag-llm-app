import type { ChatResponse } from "../../types/api"

export interface StreamChatHandlers {
    /** Chamado a cada token gerado pelo modelo. */
    onToken: (token: string) => void
    /** Chamado uma vez, com as fontes recuperadas pelo RAG. */
    onSources?: (sources: string[]) => void
    /** Permite cancelar a geração (ex.: desmontar o componente). */
    signal?: AbortSignal
}

export interface IChatService {
    askQuestion(question: string): Promise<ChatResponse>
    /** Envia a pergunta e recebe a resposta em streaming via SSE. */
    askQuestionStreaming(question: string, handlers: StreamChatHandlers): Promise<void>
}