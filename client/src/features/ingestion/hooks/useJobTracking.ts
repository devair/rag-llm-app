import { useEffect, useState } from 'react'
import type { JobStatusResponse, JobStatusType } from '../../../types/api'
import { ingestionService } from '../../../services/serviceContainer'
import type { IIngestionService } from '../../../services/interfaces/IIngestionService'

const POLL_INTERVAL_MS = 3000
const ACTIVE_STATUSES: JobStatusType[] = ['PENDING', 'PROCESSING']

interface UseJobTrackingOptions {
  service?: IIngestionService
}

function isActive(job: JobStatusResponse): boolean {
  return ACTIVE_STATUSES.includes(String(job.status) as JobStatusType)
}

/**
 * Responsabilidade única: fazer polling do status dos jobs ativos e
 * manter a lista sincronizada com o backend.
 */
export function useJobTracking({ service = ingestionService }: UseJobTrackingOptions = {}) {
  const [trackedJobs, setTrackedJobs] = useState<JobStatusResponse[]>([])

  useEffect(() => {
    const activeJobs = trackedJobs.filter(isActive)
    if (activeJobs.length === 0) return

    const interval = setInterval(() => {
      activeJobs.forEach(async (job) => {
        try {
          const updated = await service.getJobStatus(job.jobId)
          setTrackedJobs((prev) =>
            prev.map((item) => (item.jobId === updated.jobId ? updated : item)),
          )
        } catch (error) {
          console.error('Erro ao consultar o status do job', error)
        }
      })
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [trackedJobs, service, setTrackedJobs])

  const trackJob = (job: JobStatusResponse) => {
    setTrackedJobs((prev) => [job, ...prev])
  }

  return { trackedJobs, trackJob }
}