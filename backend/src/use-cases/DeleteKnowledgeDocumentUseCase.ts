import { IVectorRepository } from "../domain/interfaces/IVectorRepository"

export class DeleteKnowledgeDocumentUseCase {
    constructor(private readonly vectorRepository: IVectorRepository) {}

    execute(documentName: string): Promise<boolean> {
        return this.vectorRepository.deleteDocument(documentName)
    }
}
