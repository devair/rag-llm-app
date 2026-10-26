import { useEffect, useState } from "react"
import { sessionService } from "../../../services/serviceContainer"
import type { ISessionService } from "../../../services/interfaces/ISessionService"

interface UseSessionContextOptions {
    service?: ISessionService
}

export function useSessionContext(
    sessionId: string | null,
    { service = sessionService }: UseSessionContextOptions = {}
) {
    const [state, setState] = useState<{
        sessionId: string
        sessionIds: string[]
    } | null>(null)
    const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)
    const [savingSessionId, setSavingSessionId] = useState<string | null>(null)
    const [reloadVersion, setReloadVersion] = useState(0)
    const [errorState, setErrorState] = useState<{
        sessionId: string
        error: string
    } | null>(null)

    useEffect(() => {
        if (!sessionId) return
        let isActive = true
        setLoadingSessionId(sessionId)
        setErrorState(null)
        service.getContextSessions(sessionId)
            .then((sessionIds) => {
                if (isActive) setState({ sessionId, sessionIds })
            })
            .catch((cause: unknown) => {
                console.error("Falha ao carregar sessões de contexto:", cause)
                if (isActive) {
                    setErrorState({
                        sessionId,
                        error: cause instanceof Error
                            ? cause.message
                            : "Não foi possível carregar as sessões de contexto."
                    })
                }
            })
            .finally(() => {
                if (isActive) setLoadingSessionId(null)
            })

        return () => {
            isActive = false
        }
    }, [sessionId, service, reloadVersion])

    const update = async (sessionIds: string[]) => {
        if (!sessionId || savingSessionId) return
        setSavingSessionId(sessionId)
        setErrorState(null)
        try {
            const savedSessionIds = await service.updateContextSessions(sessionId, sessionIds)
            setState({ sessionId, sessionIds: savedSessionIds })
        } catch (cause) {
            console.error("Falha ao atualizar sessões de contexto:", cause)
            setErrorState({
                sessionId,
                error: cause instanceof Error
                    ? cause.message
                    : "Não foi possível atualizar as sessões de contexto."
            })
        } finally {
            setSavingSessionId(null)
        }
    }

    return {
        sessionIds: sessionId && state?.sessionId === sessionId ? state.sessionIds : [],
        isLoading: sessionId !== null && loadingSessionId === sessionId,
        isSaving: sessionId !== null && savingSessionId === sessionId,
        error: sessionId && errorState?.sessionId === sessionId ? errorState.error : null,
        update,
        retry: () => setReloadVersion((version) => version + 1)
    }
}
