import { Session } from "../domain/entities/Session"
import { ISessionRepository } from "../domain/interfaces/ISessionRepository"

export class ListSessionsUseCase {
    constructor(private readonly sessionRepository: ISessionRepository) {}

    async execute(): Promise<Session[]> {
        return this.sessionRepository.findAll()
    }
}
