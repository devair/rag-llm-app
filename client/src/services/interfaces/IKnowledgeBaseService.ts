import type { KnowledgeDocument } from "../../types/api"

export interface IKnowledgeBaseService {
    listDocuments(): Promise<KnowledgeDocument[]>
    deleteDocument(documentName: string): Promise<void>
}
