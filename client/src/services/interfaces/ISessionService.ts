import type { Session, SessionMessage } from "../../types/api"

export interface ISessionService {
    createSession(): Promise<Session>
    listSessions(): Promise<Session[]>
    getMessages(sessionId: string): Promise<SessionMessage[]>
}
