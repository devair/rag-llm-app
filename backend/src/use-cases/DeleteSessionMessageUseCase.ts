import { ISessionRepository } from "../domain/interfaces/ISessionRepository"

export class DeleteSessionMessageUseCase {
    constructor(private readonly sessionRepository: ISessionRepository) {}

    async execute(sessionId: string, messageId: string): Promise<boolean> {
        return this.sessionRepository.deleteMessage(sessionId, messageId)
    }
}
