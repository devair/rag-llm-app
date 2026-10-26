import type { Session, SessionMessage } from "../../types/api"

export interface ISessionService {
    createSession(): Promise<Session>
    listSessions(): Promise<Session[]>
    getMessages(sessionId: string): Promise<SessionMessage[]>
    getContextSessions(sessionId: string): Promise<string[]>
    updateContextSessions(sessionId: string, sessionIds: string[]): Promise<string[]>
}
