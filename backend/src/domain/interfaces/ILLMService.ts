export interface ILLMService {
    generateEmbedding(text: string): Promise<number[]>
    generateCompletion(prompt: string, context: string[]): Promise<string>
    /**
     * Gera a resposta token a token (streaming), para ser consumido via SSE.
     */
    streamCompletion(prompt: string, context: string[]): AsyncIterable<string>
}