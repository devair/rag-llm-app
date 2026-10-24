import { useCallback } from "react"
import { IngestionPanel } from "../ingestion/IngestionPanel"
import { KnowledgeDocumentList } from "./KnowledgeDocumentList"
import { useKnowledgeDocuments } from "./hooks/useKnowledgeDocuments"

export function KnowledgeBaseSection() {
    const {
        documents,
        isLoading,
        deletingDocument,
        error,
        refreshDocuments,
        deleteDocument
    } = useKnowledgeDocuments()
    const handleJobCompleted = useCallback(() => {
        void refreshDocuments()
    }, [refreshDocuments])

    return (
        <section className="administration-section" aria-labelledby="administration-title">
            <h2 id="administration-title" className="section-title">Administração da base RAG</h2>
            <div className="administration-layout">
                <KnowledgeDocumentList
                    documents={documents}
                    isLoading={isLoading}
                    deletingDocument={deletingDocument}
                    error={error}
                    onRefresh={() => void refreshDocuments()}
                    onDelete={deleteDocument}
                />
                <IngestionPanel onJobCompleted={handleJobCompleted} />
            </div>
        </section>
    )
}
