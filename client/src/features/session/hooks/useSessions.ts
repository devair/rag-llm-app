import { useCallback, useEffect, useState } from "react"
import type { Session } from "../../../types/api"
import { sessionService } from "../../../services/serviceContainer"
import type { ISessionService } from "../../../services/interfaces/ISessionService"

interface UseSessionsOptions {
    service?: ISessionService
}

export function useSessions({ service = sessionService }: UseSessionsOptions = {}) {
    const [sessions, setSessions] = useState<Session[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [createError, setCreateError] = useState<string | null>(null)

    const loadSessions = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true)
        setError(null)

        try {
            setSessions(await service.listSessions())
        } catch (cause) {
            console.error("Falha ao carregar sessões:", cause)
            setError(cause instanceof Error ? cause.message : "Não foi possível carregar as sessões.")
        } finally {
            if (showLoading) setIsLoading(false)
        }
    }, [service])

    const createSession = useCallback(async (): Promise<Session | null> => {
        setIsCreating(true)
        setCreateError(null)

        try {
            const session = await service.createSession()
            setSessions((current) => [session, ...current])
            setError(null)
            return session
        } catch (cause) {
            console.error("Falha ao criar sessão:", cause)
            setCreateError(cause instanceof Error ? cause.message : "Não foi possível criar a sessão.")
            return null
        } finally {
            setIsCreating(false)
        }
    }, [service])

    useEffect(() => {
        void loadSessions()
    }, [loadSessions])

    return { sessions, isLoading, isCreating, error, createError, createSession, reloadSessions: loadSessions }
}
