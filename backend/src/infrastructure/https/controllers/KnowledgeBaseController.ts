import { Request, Response } from "express"
import { DeleteKnowledgeDocumentUseCase } from "../../../use-cases/DeleteKnowledgeDocumentUseCase"
import { ListKnowledgeDocumentsUseCase } from "../../../use-cases/ListKnowledgeDocumentsUseCase"

export class KnowledgeBaseController {
    constructor(
        private readonly listDocumentsUseCase: ListKnowledgeDocumentsUseCase,
        private readonly deleteDocumentUseCase: DeleteKnowledgeDocumentUseCase
    ) {}

    async listDocuments(_req: Request, res: Response): Promise<Response> {
        try {
            const documents = await this.listDocumentsUseCase.execute()
            return res.status(200).json(documents)
        } catch (error) {
            console.error("[KnowledgeBaseController] Falha ao listar documentos:", error)
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao listar documentos."
            return res.status(500).json({ error: message })
        }
    }

    async deleteDocument(req: Request, res: Response): Promise<Response> {
        const documentName = req.query.documentName
        if (typeof documentName !== "string" || !documentName.trim()) {
            return res.status(400).json({ error: "documentName não informado." })
        }

        try {
            const deleted = await this.deleteDocumentUseCase.execute(documentName.trim())
            if (!deleted) {
                return res.status(404).json({ error: "Documento não encontrado na base de conhecimento." })
            }

            return res.status(200).json({ message: "Documento removido da base de conhecimento." })
        } catch (error) {
            console.error("[KnowledgeBaseController] Falha ao remover documento:", error)
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao remover documento."
            return res.status(500).json({ error: message })
        }
    }
}
