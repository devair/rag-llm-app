import { useCallback, useState } from "react"
import type { IChatService } from "../../../services/interfaces/IChatService"
import type { ChatMessage } from "../../../types/api"
import { generateId } from "../../../utils/uuid"
import { chatService } from "../../../services/serviceContainer"

interface UseChatOptions {
    service?: IChatService
}

/**
 * Lógica de estado do chat (SRP): a UI apenas consome este hook,
 * sem conhecer HTTP nem de layout global.
 */
export function useChat({ service = chatService }: UseChatOptions = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [question, setQuestion] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isStreaming, setIsStreaming] = useState<boolean>(false)

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

    const sendQuestion = useCallback(async () => {
        const trimmed = question.trim()
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
        setIsLoading(true)
        setIsStreaming(true)

        try {
            await service.streamQuestion(
                trimmed,
                (token) => appendToken(assistantMessageId, token),
                (sources) => updateMessage(assistantMessageId, { sources })
            )
        } catch (error) {
            console.error("Erro ao receber resposta via streaming:", error)
            updateMessage(assistantMessageId, { text: "Erro ao processar resposta." })
        } finally {
            setIsLoading(false)
            setIsStreaming(false)
        }
    }, [question, isLoading, appendMessage, appendToken, service, updateMessage])

    return { messages, question, setQuestion, isLoading, isStreaming, sendQuestion }
}
