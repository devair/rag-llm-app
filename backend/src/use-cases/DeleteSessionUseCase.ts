import { ISessionRepository } from "../domain/interfaces/ISessionRepository"
import { ISessionMemoryRepository } from "../domain/interfaces/ISessionMemoryRepository"

export class DeleteSessionUseCase {
    constructor(
        private readonly sessionRepository: ISessionRepository,
        private readonly sessionMemoryRepository: ISessionMemoryRepository
    ) {}

    async execute(sessionId: string): Promise<boolean> {
        const session = await this.sessionRepository.findById(sessionId)
        if (!session) return false

        await this.sessionMemoryRepository.deleteSessionReferences(sessionId)
        await this.sessionRepository.delete(sessionId)
        return true
    }
}
