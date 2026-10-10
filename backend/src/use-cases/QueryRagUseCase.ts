import { ILLMService } from "../domain/interfaces/ILLMService"
import { IVectorRepository } from "../domain/interfaces/IVectorRepository"

export class QueryRagUseCase {
    constructor(
        private vectorRepo: IVectorRepository,
        private llmService: ILLMService
    ) { }

    async execute(question: string): Promise<{ answer: string; sources: string[] }> {
        const { contexts, sources } = await this.retrieveContext(question)

        const answer = await this.llmService.generateCompletion(question, contexts)

        return { answer, sources }
    }

    /**
     * Executa o mesmo fluxo de RAG, porém transmitindo a resposta token a token.
     * Emite primeiro o evento "sources" (fontes recuperadas) e depois os tokens.
     */
    async* executeStream(question: string): AsyncGenerator<{ event: string; data: unknown }> {
        const { contexts, sources } = await this.retrieveContext(question)

        yield { event: 'sources', data: sources }

        for await (const token of this.llmService.streamCompletion(question, contexts)) {
            yield { event: 'token', data: token }
        }

        yield { event: 'done', data: '[DONE]' }
    }

    private async retrieveContext(question: string): Promise<{ contexts: string[]; sources: string[] }> {
        const queryEmbedding = await this.llmService.generateEmbedding(question)
        const similiarChunks = await this.vectorRepo.searchSimiliar(queryEmbedding, 4)

        const contexts = similiarChunks.map(c => c.content)
        const sources = Array.from(new Set(similiarChunks.map(c => c.documentName)))

        return { contexts, sources }
    }
}