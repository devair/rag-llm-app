import { ILLMService } from "../domain/interfaces/ILLMService"
import { IVectorRepository } from "../domain/interfaces/IVectorRepository"

export class QueryRagUseCase {
    constructor(
        private vectorRepo: IVectorRepository,
        private llmService: ILLMService
    ) { }

    private async getContextsAndSources(queryEmbedding: number[]): Promise<{ contexts: string[]; sources: string[] }> {
        const similarChunks = await this.vectorRepo.searchSimilar(queryEmbedding, 4)
        const contexts = similarChunks.map(c => c.content)
        const sources = Array.from(new Set(similarChunks.map(c => c.documentName)))
        return { contexts, sources }
    }

    async execute(question: string): Promise<{ answer: string; sources: string[] }> {
        const queryEmbedding = await this.llmService.generateEmbedding(question)
        const { contexts, sources } = await this.getContextsAndSources(queryEmbedding)
        const answer = await this.llmService.generateCompletion(question, contexts)

        return { answer, sources }
    }

    async executeStream(question: string): Promise<{
        sources: string[]
        answerStream: AsyncIterable<string>
    }> {
        const queryEmbedding = await this.llmService.generateEmbedding(question)
        const { contexts, sources } = await this.getContextsAndSources(queryEmbedding)

        return {
            sources,
            answerStream: this.llmService.generateCompletionStream(question, contexts)
        }
    }
}