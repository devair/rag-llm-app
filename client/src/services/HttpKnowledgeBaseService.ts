import type { KnowledgeDocument } from "../types/api"
import { httpClient } from "./httpClient"
import type { IKnowledgeBaseService } from "./interfaces/IKnowledgeBaseService"

export class HttpKnowledgeBaseService implements IKnowledgeBaseService {
    listDocuments(): Promise<KnowledgeDocument[]> {
        return httpClient.get<KnowledgeDocument[]>("/api/knowledge/documents")
    }

    async deleteDocument(documentName: string): Promise<void> {
        await httpClient.delete<{ message: string }>(
            `/api/knowledge/documents?documentName=${encodeURIComponent(documentName)}`
        )
    }
}
