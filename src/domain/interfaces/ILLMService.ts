export interface ILLMService {
    generateEmbedding(text: string): Promise<number[]>
    generateCompletion(prompt: string, context: string[]): Promise<string>
}