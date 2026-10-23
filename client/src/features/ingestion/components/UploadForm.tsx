import { useEffect, useRef, type ChangeEvent, type FormEvent } from "react"

interface UploadFormProps {
    isUploading: boolean
    hasSelectedFile: boolean
    selectedFileName: string | null
    onFileChange: (file: File | null) => void
    onSubmit: () => void
}

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.html'

/** Formulário de upload — apresentação pura, sem lógica de envio. */
export function UploadForm({
    isUploading,
    hasSelectedFile,
    selectedFileName,
    onFileChange,
    onSubmit
}: UploadFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (selectedFileName === null && fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }, [selectedFileName])

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onFileChange(event.target.files?.[0] ?? null)
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        onSubmit()
    }

    return (
        <form onSubmit={handleSubmit} className="upload-form">
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleInputChange}
                disabled={isUploading}
                accept={ACCEPTED_EXTENSIONS}
                aria-label="Selecionar documento para ingestão"
                className="upload-file-input"
            />
            <div className="upload-file-info">
                <span className="upload-file-name">
                    {selectedFileName ?? 'Nenhum arquivo selecionado'}
                </span>
                <span className="upload-hint">PDF, DOCX, TXT ou HTML</span>
            </div>
            <button
                type="submit"
                disabled={!hasSelectedFile || isUploading}
                className="btn-primary upload-submit"
            >
                {isUploading ? 'Enviando arquivo...' : 'Enviar e processar'}
            </button>
        </form>
    )
}