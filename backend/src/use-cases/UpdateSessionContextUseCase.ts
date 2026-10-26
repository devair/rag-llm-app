import { ISessionMemoryRepository } from "../domain/interfaces/ISessionMemoryRepository"
import { ISessionRepository } from "../domain/interfaces/ISessionRepository"

export class SessionContextValidationError extends Error {}

export class UpdateSessionContextUseCase {
    constructor(
        private readonly sessionRepository: ISessionRepository,
        private readonly sessionMemoryRepository: ISessionMemoryRepository
    ) {}

    async get(sessionId: string): Promise<string[] | null> {
        const session = await this.sessionRepository.findById(sessionId)
        if (!session) return null
        return this.sessionMemoryRepository.getContextSessionIds(sessionId)
    }

    async update(sessionId: string, sourceSessionIds: string[]): Promise<string[] | null> {
        const session = await this.sessionRepository.findById(sessionId)
        if (!session) return null

        const uniqueIds = [...new Set(sourceSessionIds)]
        if (uniqueIds.length > 10) {
            throw new SessionContextValidationError("É possível selecionar no máximo 10 sessões de contexto.")
        }
        if (uniqueIds.includes(sessionId)) {
            throw new SessionContextValidationError("Uma sessão não pode usar a si mesma como contexto.")
        }

        const sourceSessions = await Promise.all(
            uniqueIds.map((sourceSessionId) => this.sessionRepository.findById(sourceSessionId))
        )
        if (sourceSessions.some((source) => !source)) {
            throw new SessionContextValidationError("Uma ou mais sessões de contexto não foram encontradas.")
        }
        if (sourceSessions.some((source) => source?.userId !== session.userId)) {
            throw new SessionContextValidationError(
                "As sessões de contexto devem pertencer ao mesmo usuário."
            )
        }

        await this.sessionMemoryRepository.setContextSessionIds(sessionId, uniqueIds)
        return uniqueIds
    }
}
