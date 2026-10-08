import { ILLMService } from "../domain/interfaces/ILLMService"
import { IVectorRepository } from "../domain/interfaces/IVectorRepository"

export class QueryRagUseCase {
    constructor(
        private vectorRepo: IVectorRepository,
        private llmService: ILLMService
    ) { }

    async execute(question: string): Promise<{ answer: string; sources: string[] }> {
        const queryEmbedding = await this.llmService.generateEmbedding(question)
        const similiarChunks = await this.vectorRepo.searchSimiliar(queryEmbedding, 4)

        const contexts = similiarChunks.map(c => c.content)
        const sources = Array.from(new Set(similiarChunks.map(c => c.documentName)))

        const answer = await this.llmService.generateCompletion(question, contexts)

        return { answer, sources }
    }
}