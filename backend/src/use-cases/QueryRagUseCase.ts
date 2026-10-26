import { ILLMService } from "../domain/interfaces/ILLMService"
import type { SessionMemoryEntry } from "../domain/entities/SessionMemory"
import { ISessionMemoryRepository } from "../domain/interfaces/ISessionMemoryRepository"
import { ISessionRepository } from "../domain/interfaces/ISessionRepository"
import { IVectorRepository } from "../domain/interfaces/IVectorRepository"

export class QueryRagUseCase {
    constructor(
        private vectorRepo: IVectorRepository,
        private llmService: ILLMService,
        private sessionRepository: ISessionRepository,
        private sessionMemoryRepository: ISessionMemoryRepository
    ) { }

    private async getDocumentContexts(queryEmbedding: number[]): Promise<{
        contexts: string[]
        sources: string[]
    }> {
        const similarChunks = await this.vectorRepo.searchSimilar(queryEmbedding, 4)
        const contexts = similarChunks.map(c => c.content)
        const sources = Array.from(new Set(similarChunks.map(c => c.documentName)))
        return { contexts, sources }
    }

    private async getSessionContexts(
        queryEmbedding: number[],
        sessionId?: string
    ): Promise<string[]> {
        if (!sessionId) return []
        const sourceSessionIds = await this.sessionMemoryRepository.getContextSessionIds(sessionId)
        if (sourceSessionIds.length === 0) return []

        const messagesBySession = await Promise.all(sourceSessionIds.map(async (sourceSessionId) => ({
            sessionId: sourceSessionId,
            messages: await this.sessionRepository.getMessages(sourceSessionId)
        })))
        const existingEntries = await this.sessionMemoryRepository.getIndexedMessages(sourceSessionIds)
        const indexedByMessageId = new Map(existingEntries.map((entry) => [entry.messageId, entry]))
        const pendingEntries = messagesBySession.flatMap(({ sessionId: sourceSessionId, messages }) =>
            messages
                .filter((message) => {
                    if (!message.content.trim()) return false
                    const indexed = indexedByMessageId.get(message.id)
                    return !indexed || indexed.content !== message.content || indexed.role !== message.role
                })
                .map((message) => ({ sourceSessionId, message }))
        )

        const newEntries: SessionMemoryEntry[] = []
        let nextIndex = 0
        const indexWorker = async () => {
            while (nextIndex < pendingEntries.length) {
                const entryIndex = nextIndex++
                const { sourceSessionId, message } = pendingEntries[entryIndex]
                const embedding = await this.llmService.generateEmbedding(message.content)
                newEntries.push({
                    messageId: message.id,
                    sourceSessionId,
                    role: message.role,
                    content: message.content,
                    embedding
                })
            }
        }
        await Promise.all(Array.from(
            { length: Math.min(2, pendingEntries.length) },
            () => indexWorker()
        ))
        await this.sessionMemoryRepository.saveIndexedMessages(newEntries)

        await Promise.all(messagesBySession.map(({ sessionId: sourceSessionId, messages }) =>
            this.sessionMemoryRepository.deleteIndexedMessagesNotIn(
                sourceSessionId,
                messages.map(({ id }) => id)
            )
        ))

        const matches = await this.sessionMemoryRepository.searchSimilar(
            queryEmbedding,
            sourceSessionIds,
            4
        )
        return matches.map((match) =>
            `Sessão "${match.sessionTitle}" (${match.role}):\n${match.content}`
        )
    }

    private async getContextsAndSources(
        queryEmbedding: number[],
        sessionId?: string
    ): Promise<{ contexts: string[]; sources: string[] }> {
        const [documentResult, sessionContexts] = await Promise.all([
            this.getDocumentContexts(queryEmbedding),
            this.getSessionContexts(queryEmbedding, sessionId)
        ])
        return {
            contexts: [...documentResult.contexts, ...sessionContexts],
            sources: documentResult.sources
        }
    }

    async execute(question: string, sessionId?: string): Promise<{ answer: string; sources: string[] }> {
        const queryEmbedding = await this.llmService.generateEmbedding(question)
        const { contexts, sources } = await this.getContextsAndSources(queryEmbedding, sessionId)
        const answer = await this.llmService.generateCompletion(question, contexts)

        return { answer, sources }
    }

    async executeStream(question: string, sessionId?: string): Promise<{
        sources: string[]
        answerStream: AsyncIterable<string>
    }> {
        const queryEmbedding = await this.llmService.generateEmbedding(question)
        const { contexts, sources } = await this.getContextsAndSources(queryEmbedding, sessionId)

        return {
            sources,
            answerStream: this.llmService.generateCompletionStream(question, contexts)
        }
    }
}