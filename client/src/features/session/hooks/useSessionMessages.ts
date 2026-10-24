import { useCallback, useEffect, useRef, useState } from "react"
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
    const [isSending, setIsSending] = useState(false)
    const [errorState, setErrorState] = useState<{
        sessionId: string
        error: string
    } | null>(null)
    const activeSessionId = useRef(sessionId)

    useEffect(() => {
        activeSessionId.current = sessionId
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

    const sendMessage = useCallback(async (content: string): Promise<boolean> => {
        if (!sessionId || isSending) return false

        setIsSending(true)
        setErrorState(null)
        try {
            const message = await service.createMessage(sessionId, content, "user")
            if (activeSessionId.current !== sessionId) return false
            setMessageState((current) => ({
                sessionId,
                messages: current?.sessionId === sessionId
                    ? [...current.messages, message]
                    : [message]
            }))
            return true
        } catch (cause) {
            console.error("Falha ao enviar mensagem:", cause)
            if (activeSessionId.current === sessionId) {
                setErrorState({
                    sessionId,
                    error: cause instanceof Error
                        ? cause.message
                        : "Não foi possível enviar a mensagem."
                })
            }
            return false
        } finally {
            setIsSending(false)
        }
    }, [isSending, service, sessionId])

    return {
        messages: sessionId && messageState?.sessionId === sessionId ? messageState.messages : [],
        isLoading: sessionId !== null && loadedSessionId !== sessionId,
        isSending,
        error: sessionId && errorState?.sessionId === sessionId ? errorState.error : null,
        sendMessage
    }
}
