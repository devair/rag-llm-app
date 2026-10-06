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
        const contextFormmated = context.join('\n\n---\n\n')
        const systemPrompt = `Voce é um assistente preciso. 
            Responda à pergunta do usuário usando APENAS o contexto fornecido abaixo.
            \n\nContexto:\n${contextFormmated}`

        const response = await this.client.chat({
            model: this.llmModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            stream: false
        })

        return response.message.content
    }


}