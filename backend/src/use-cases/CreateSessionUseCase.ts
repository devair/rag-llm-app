import { Session } from "../domain/entities/Session"
import { ISessionRepository } from "../domain/interfaces/ISessionRepository"

export class CreateSessionUseCase {
    constructor(private readonly sessionRepository: ISessionRepository) {}

    async execute(userId = "local-user"): Promise<Session> {
        try {
            const session = await this.sessionRepository.create({
                userId,
                title: "Nova conversa",
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return session;
        } catch (error) {
            console.error('[CreateSessionUseCase] Falha ao criar sessão:', error);
            throw error;
        }
    }
}
