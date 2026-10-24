import { Message } from "../domain/entities/Session"
import { ISessionRepository } from "../domain/interfaces/ISessionRepository"

export class UpdateSessionMessageUseCase {
    constructor(private readonly sessionRepository: ISessionRepository) {}

    async execute(
        sessionId: string,
        messageId: string,
        content: string,
        role: Message["role"]
    ): Promise<Message | null> {
        return this.sessionRepository.updateMessage(sessionId, messageId, content, role)
    }
}
