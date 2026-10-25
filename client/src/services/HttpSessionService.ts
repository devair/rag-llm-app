import type { Session, SessionMessage } from "../types/api"
import { httpClient } from "./httpClient"
import type { ISessionService } from "./interfaces/ISessionService"

interface CreateSessionResponse extends Session {
    sessionId: string
}

export class HttpSessionService implements ISessionService {
    async createSession(): Promise<Session> {
        const response = await httpClient.postJson<CreateSessionResponse>("/api/sessions", {})
        return {
            id: response.id,
            userId: response.userId,
            title: response.title,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt
        }
    }

    listSessions(): Promise<Session[]> {
        return httpClient.get<Session[]>("/api/sessions")
    }

    getMessages(sessionId: string): Promise<SessionMessage[]> {
        return httpClient.get<SessionMessage[]>(
            `/api/sessions/${encodeURIComponent(sessionId)}/messages`
        )
    }
}
