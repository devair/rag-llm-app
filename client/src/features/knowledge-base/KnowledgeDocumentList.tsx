import type { KnowledgeDocument } from "../../types/api"

interface KnowledgeDocumentListProps {
    documents: KnowledgeDocument[]
    isLoading: boolean
    deletingDocument: string | null
    error: string | null
    onRefresh: () => void
    onDelete: (documentName: string) => Promise<boolean>
}

export function KnowledgeDocumentList({
    documents,
    isLoading,
    deletingDocument,
    error,
    onRefresh,
    onDelete
}: KnowledgeDocumentListProps) {
    const handleDelete = async (documentName: string) => {
        const confirmed = window.confirm(
            `Remover "${documentName}" da base de conhecimento? Esta ação não pode ser desfeita.`
        )
        if (confirmed) await onDelete(documentName)
    }

    return (
        <section className="card knowledge-documents" aria-labelledby="knowledge-documents-title">
            <div className="knowledge-documents-header">
                <h2 id="knowledge-documents-title">Documentos indexados</h2>
                <button type="button" onClick={onRefresh} disabled={isLoading}>
                    {isLoading ? "Atualizando..." : "Atualizar"}
                </button>
            </div>
            {error && <p className="feedback-msg feedback-error" role="alert">{error}</p>}
            {isLoading ? (
                <p className="empty-text" role="status">Carregando documentos...</p>
            ) : documents.length === 0 ? (
                <p className="empty-text">Nenhum documento indexado na base.</p>
            ) : (
                <ul className="knowledge-document-list">
                    {documents.map((document) => (
                        <li className="knowledge-document-item" key={document.documentName}>
                            <div className="knowledge-document-info">
                                <strong>{document.documentName}</strong>
                                <span>
                                    {document.chunkCount} {document.chunkCount === 1 ? "trecho" : "trechos"}
                                    {" · "}
                                    Indexado em {new Date(document.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="knowledge-document-delete"
                                onClick={() => void handleDelete(document.documentName)}
                                disabled={deletingDocument !== null}
                                aria-label={`Remover ${document.documentName}`}
                            >
                                {deletingDocument === document.documentName ? "Removendo..." : "Remover"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
