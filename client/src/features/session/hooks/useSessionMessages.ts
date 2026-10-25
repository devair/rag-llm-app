import { useEffect, useState } from "react"
import type { SessionMessage } from "../../../types/api"
import { sessionService } from "../../../services/serviceContainer"
import type { ISessionService } from "../../../services/interfaces/ISessionService"

interface UseSessionMessagesOptions {
    service?: ISessionService
}

export function useSessionMessages(
    sessionId: string | null,
    { service = sessionService }: UseSessionMessagesOptions = {}
) {
    const [messageState, setMessageState] = useState<{
        sessionId: string
        messages: SessionMessage[]
    } | null>(null)
    const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null)
    const [errorState, setErrorState] = useState<{
        sessionId: string
        error: string
    } | null>(null)

    useEffect(() => {
        if (!sessionId) {
            return
        }

        let isActive = true
        service.getMessages(sessionId)
            .then((loadedMessages) => {
                if (isActive) setMessageState({ sessionId, messages: loadedMessages })
            })
            .catch((cause: unknown) => {
                console.error("Falha ao carregar mensagens da sessão:", cause)
                if (isActive) {
                    setErrorState({
                        sessionId,
                        error: cause instanceof Error
                            ? cause.message
                            : "Não foi possível carregar as mensagens."
                    })
                }
            })
            .finally(() => {
                if (isActive) {
                    setLoadedSessionId(sessionId)
                }
            })

        return () => {
            isActive = false
        }
    }, [sessionId, service])

    return {
        messages: sessionId && messageState?.sessionId === sessionId ? messageState.messages : [],
        isLoading: sessionId !== null && loadedSessionId !== sessionId,
        error: sessionId && errorState?.sessionId === sessionId ? errorState.error : null
    }
}
