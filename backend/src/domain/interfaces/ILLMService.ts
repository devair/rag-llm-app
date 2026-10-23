export interface ILLMService {
    generateEmbedding(text: string): Promise<number[]>
    generateCompletion(prompt: string, context: string[]): Promise<string>
    generateCompletionStream(prompt: string, context: string[]): AsyncIterable<string>
}