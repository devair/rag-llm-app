import { KnowledgeDocument } from "../domain/entities/KnowledgeDocument"
import { IVectorRepository } from "../domain/interfaces/IVectorRepository"

export class ListKnowledgeDocumentsUseCase {
    constructor(private readonly vectorRepository: IVectorRepository) {}

    execute(): Promise<KnowledgeDocument[]> {
        return this.vectorRepository.listDocuments()
    }
}
