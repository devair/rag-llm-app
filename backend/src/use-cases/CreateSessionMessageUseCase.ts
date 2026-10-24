import { Message } from "../domain/entities/Session"
import { ISessionRepository } from "../domain/interfaces/ISessionRepository"

export class CreateSessionMessageUseCase {
    constructor(private readonly sessionRepository: ISessionRepository) {}

    async execute(
        sessionId: string,
        content: string,
        role: Message["role"]
    ): Promise<Message | null> {
        return this.sessionRepository.createMessage(sessionId, content, role)
    }
}
