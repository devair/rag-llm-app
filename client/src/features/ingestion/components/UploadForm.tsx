import type { ChangeEvent, FormEvent } from "react"

interface UploadFormProps {
    isUploading: boolean
    hasSelectedFile: boolean
    onFileChange: (file: File | null) => void
    onSubmit: () => void
}

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.html'

/** Formulário de upload — apresentação pura, sem lógica de envio. */
export function UploadForm({ isUploading, hasSelectedFile, onFileChange, onSubmit }: UploadFormProps) {

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
                type="file"
                onChange={handleInputChange}
                disabled={isUploading}
                accept={ACCEPTED_EXTENSIONS}
            />
            <button type="submit" disabled={!hasSelectedFile || isUploading} className="btn-primary">
                {isUploading ? 'Enviando' : 'Fazer upload e processar'}
            </button>
        </form>
    )
}