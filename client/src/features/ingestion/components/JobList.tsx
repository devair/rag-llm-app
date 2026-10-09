import type { JobStatusResponse } from "../../../types/api"
import { JobItem } from "./JobItem"

interface JobListProps {
    jobs: JobStatusResponse[]
}

export function JobList({ jobs }: JobListProps) {
    if (jobs.length === 0) {
        return <p className="empty-text">
            Nenhum job de ingestão rastreado no momento
        </p>
    }


    return (
        <div className="jobs-list">
            {jobs.map((job) => (
                <JobItem key={job.jobId} job={job}/>
            ))}
        </div>
    )
}