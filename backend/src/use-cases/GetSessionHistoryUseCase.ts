
import { Message } from "../domain/entities/Session"
import { ISessionRepository } from "../domain/interfaces/ISessionRepository"


export class GetSessionHistoryUseCase {
    constructor(private readonly sessionRepository: ISessionRepository) {}

    async execute(sessionId: string): Promise<Message[] | null> {
        try {
            const session = await this.sessionRepository.findById(sessionId);
            if (!session) return null;

            const messages = await this.sessionRepository.getMessages(sessionId);
            return messages;
        } catch (error) {
            console.error('[GetSessionHistoryUseCase] Falha ao buscar histórico:', error);
            throw error;
        }
    }
}
