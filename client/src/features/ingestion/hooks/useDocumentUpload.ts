import { useCallback, useState } from 'react'
import type { JobStatusResponse } from '../../../types/api'
import { ingestionService } from '../../../services/serviceContainer'
import type { IIngestionService } from '../../../services/interfaces/IIngestionService'

interface UseDocumentUploadOptions {
  service?: IIngestionService
}

/**
 * Estado do upload de documentos. A UI não conhece FormData nem endpoints.
 */
export function useDocumentUpload({ service = ingestionService }: UseDocumentUploadOptions = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const handleFileChange = useCallback((file: File | null) => {
    setSelectedFile(file)
    setFeedbackMessage(null)
  }, [])

  const uploadSelectedFile = useCallback(async () => {
    if (!selectedFile || isUploading) return

    setIsUploading(true)
    setFeedbackMessage('')

    try {
      const data = await service.uploadDocument(selectedFile)
      setFeedbackMessage(`Arquivo enfileirado! ID do Job: ${data.jobId}`)
      setSelectedFile(null)

      const newJob: JobStatusResponse = {
        jobId: data.jobId,
        fileName: selectedFile.name,
        status: 'PENDING',
        errorMessage: null,
        updatedAt: new Date().toISOString(),
      }

      return newJob
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar arquivo.'
      setFeedbackMessage(`Error: ${message}`)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, isUploading, service])

  return {
    selectedFile,
    isUploading,
    feedbackMessage,
    handleFileChange,
    uploadSelectedFile,
  }
}