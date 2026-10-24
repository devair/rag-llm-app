import { ISessionRepository } from "../domain/interfaces/ISessionRepository"

export class UpdateSessionTitleUseCase {
    constructor(private readonly sessionRepository: ISessionRepository) {}

    execute(sessionId: string, title: string): Promise<boolean> {
        return this.sessionRepository.updateTitleIfDefault(sessionId, title)
    }
}
