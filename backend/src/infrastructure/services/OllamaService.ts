import { Ollama } from "ollama"
import { ILLMService } from "../../domain/interfaces/ILLMService"

export class OllamaService implements ILLMService {
    private client: Ollama
    constructor(
        private host: string,
        private embedModel: string,
        private llmModel: string) {
        this.client = new Ollama({ host: host })
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const response = await this.client.embeddings({
            model: this.embedModel,
            prompt: text
        })

        return response.embedding
    }
    async generateCompletion(prompt: string, context: string[]): Promise<string> {
        const response = await this.client.chat({
            model: this.llmModel,
            messages: this.buildRagMessages(prompt, context),
            stream: false
        })

        return response.message.content
    }

    async* streamCompletion(prompt: string, context: string[]): AsyncGenerator<string> {
        const response = await this.client.chat({
            model: this.llmModel,
            messages: this.buildRagMessages(prompt, context),
            stream: true
        })

        for await (const chunk of response) {
            const token = chunk.message?.content
            if (token) yield token
        }
    }

    private buildRagMessages(prompt: string, context: string[]) {
        const contextFormmated = context.join('\n\n---\n\n')
        const systemPrompt = `Voce é um assistente preciso.
            Responda APENAS em português do brasil.
            Responda à pergunta do usuário usando APENAS o contexto fornecido abaixo.
            \n\nContexto:\n${contextFormmated}`

        return [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: prompt }
        ]
    }
}