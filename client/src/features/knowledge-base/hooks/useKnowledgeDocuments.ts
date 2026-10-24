import { useCallback, useEffect, useState } from "react"
import type { KnowledgeDocument } from "../../../types/api"
import { knowledgeBaseService } from "../../../services/serviceContainer"
import type { IKnowledgeBaseService } from "../../../services/interfaces/IKnowledgeBaseService"

interface UseKnowledgeDocumentsOptions {
    service?: IKnowledgeBaseService
}

export function useKnowledgeDocuments({
    service = knowledgeBaseService
}: UseKnowledgeDocumentsOptions = {}) {
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deletingDocument, setDeletingDocument] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const refreshDocuments = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            setDocuments(await service.listDocuments())
        } catch (cause) {
            console.error("Falha ao carregar documentos da base:", cause)
            setError(cause instanceof Error
                ? cause.message
                : "Não foi possível carregar os documentos.")
        } finally {
            setIsLoading(false)
        }
    }, [service])

    const deleteDocument = useCallback(async (documentName: string): Promise<boolean> => {
        setDeletingDocument(documentName)
        setError(null)
        try {
            await service.deleteDocument(documentName)
            setDocuments((current) => current.filter(
                (document) => document.documentName !== documentName
            ))
            return true
        } catch (cause) {
            console.error("Falha ao remover documento da base:", cause)
            setError(cause instanceof Error
                ? cause.message
                : "Não foi possível remover o documento.")
            return false
        } finally {
            setDeletingDocument(null)
        }
    }, [service])

    useEffect(() => {
        void refreshDocuments()
    }, [refreshDocuments])

    return {
        documents,
        isLoading,
        deletingDocument,
        error,
        refreshDocuments,
        deleteDocument
    }
}
