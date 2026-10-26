import { SessionMemoryEntry, SessionMemoryMatch } from "../entities/SessionMemory"

export interface ISessionMemoryRepository {
    getContextSessionIds(sessionId: string): Promise<string[]>
    setContextSessionIds(sessionId: string, sourceSessionIds: string[]): Promise<void>
    getIndexedMessages(sessionIds: string[]): Promise<SessionMemoryEntry[]>
    saveIndexedMessages(entries: SessionMemoryEntry[]): Promise<void>
    deleteIndexedMessagesNotIn(sessionId: string, messageIds: string[]): Promise<void>
    searchSimilar(
        embedding: number[],
        sourceSessionIds: string[],
        topK: number
    ): Promise<SessionMemoryMatch[]>
    deleteSessionReferences(sessionId: string): Promise<void>
}
