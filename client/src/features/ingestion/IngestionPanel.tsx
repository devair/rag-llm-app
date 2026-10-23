import { Card } from "../../shared/components/Card"
import { JobList } from "./components/JobList"
import { UploadForm } from "./components/UploadForm"
import { useDocumentUpload } from "./hooks/useDocumentUpload"
import { useJobTracking } from "./hooks/useJobTracking"

export function IngestionPanel() {
    const { trackJob, trackedJobs } = useJobTracking()
    const { selectedFile, isUploading, feedbackMessage, handleFileChange, uploadSelectedFile } = useDocumentUpload()

    const handleSubmitUpload = async () => {
        const newJob = await uploadSelectedFile()
        if (newJob) trackJob(newJob)
    }

    return (
        <section className="side-panel">
            <Card title="📄 Ingestão de Arquivos" >
                <UploadForm
                    isUploading={isUploading}
                    hasSelectedFile={selectedFile !== null}
                    selectedFileName={selectedFile?.name ?? null}
                    onFileChange={handleFileChange}
                    onSubmit={handleSubmitUpload}
                />
                {feedbackMessage &&
                    <div
                        className={`feedback-msg ${feedbackMessage.startsWith('Error:') ? 'feedback-error' : ''}`}
                        role="status"
                    >
                        {feedbackMessage}
                    </div>
                }
            </Card>
            <Card title="⏳ Status dos Jobs de Ingestão">
                <JobList jobs={trackedJobs} />
            </Card>
        </section>
    )
}