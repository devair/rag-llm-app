import { ISessionRepository } from "../domain/interfaces/ISessionRepository"

export class DeleteSessionUseCase {
    constructor(private readonly sessionRepository: ISessionRepository) {}

    async execute(sessionId: string): Promise<boolean> {
        const session = await this.sessionRepository.findById(sessionId)
        if (!session) return false

        await this.sessionRepository.delete(sessionId)
        return true
    }
}
