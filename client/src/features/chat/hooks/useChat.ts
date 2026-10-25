import { useCallback, useState } from "react"
import type { IChatService } from "../../../services/interfaces/IChatService"
import type { ChatMessage } from "../../../types/api"
import { generateId } from "../../../utils/uuid"
import { chatService } from "../../../services/serviceContainer"

interface UseChatOptions {
    service?: IChatService
    sessionId?: string
}

/**
 * Lógica de estado do chat (SRP): a UI apenas consome este hook,
 * sem conhecer HTTP nem de layout global.
 */
export function useChat({ service = chatService, sessionId }: UseChatOptions = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [question, setQuestion] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const appendMessage = useCallback((message: ChatMessage) => {
        setMessages((prev) => [...prev, message])
    }, [])

    const updateMessage = useCallback((id: string, update: Partial<ChatMessage>) => {
        setMessages((previous) => previous.map((message) =>
            message.id === id ? { ...message, ...update } : message
        ))
    }, [])

    const appendToken = useCallback((id: string, token: string) => {
        setMessages((previous) => previous.map((message) =>
            message.id === id ? { ...message, text: message.text + token } : message
        ))
    }, [])

    const sendQuestion = useCallback(async (questionOverride?: string) => {
        const trimmed = (questionOverride ?? question).trim()
        if (!trimmed || isLoading) return

        // Adiciona mensagem do usuário
        appendMessage({
            id: generateId(),
            sender: "user",
            text: trimmed,
            timestamp: new Date()
        })
        const assistantMessageId = generateId()
        appendMessage({
            id: assistantMessageId,
            sender: "assistant",
            text: "",
            sources: [],
            timestamp: new Date()
        })
        setQuestion("")
        setError(null)
        setIsLoading(true)

        try {
            await service.streamQuestion(
                trimmed,
                (token) => appendToken(assistantMessageId, token),
                (sources) => updateMessage(assistantMessageId, { sources }),
                sessionId
            )
        } catch (error) {
            console.error("Erro ao receber resposta via streaming:", error)
            const message = error instanceof Error ? error.message : "Erro ao processar resposta."
            setError(message)
            updateMessage(assistantMessageId, { text: "Erro ao processar resposta." })
        } finally {
            setIsLoading(false)
        }
    }, [question, isLoading, appendMessage, appendToken, service, sessionId, updateMessage])

    return { messages, question, setQuestion, isLoading, error, sendQuestion }
}
