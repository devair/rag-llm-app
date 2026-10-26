import { Message } from "./Session"

export interface SessionMemoryEntry {
    messageId: string
    sourceSessionId: string
    role: Message["role"]
    content: string
    embedding: number[]
}

export interface SessionMemoryMatch {
    sessionId: string
    sessionTitle: string
    role: Message["role"]
    content: string
}
