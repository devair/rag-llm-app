import type { JobStatusResponse } from "../../../types/api"
import { StatusBadge } from "./StatusBadge"

interface JobItemProps {
    job: JobStatusResponse
}

/** Item individual da lista de jobs monitorados. */
export function JobItem({ job }: JobItemProps) {
    return (
        <div className="job-item">
            <div className="job-header">
                <span className="job-file">{job.fileName || 'Arquivo'}</span>
                <StatusBadge status={job.status} />
            </div>
            <div className="job-id">ID: {job.jobId}</div>
            {job.errorMessage &&
                <div className="job-error">
                    Error: {job.errorMessage}
                </div>
            }
        </div>
    )
}