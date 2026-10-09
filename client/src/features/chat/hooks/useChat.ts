import { useCallback, useState } from "react"
import type { IChatService } from "../../../services/interfaces/IChatService"
import { chatService } from "../../../services/serviceContainer"
import type { ChatMessage } from "../../../types/api"
import { generateId } from "../../../utils/uuid"


interface UseChatOptions {
    service?: IChatService
}

/**
 * Lógica de estado do chat (SRP): a UI apenas consome este hook,
 * sem conhecer HTTP, tipos de resposta ou montagem de mensagens.
 */
export function useChat({ service = chatService }: UseChatOptions = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [question, setQuestion] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const appendMessage = useCallback((message: ChatMessage) => {
        setMessages((prev) => [...prev, message])
    }, [])

    const sendQuestion = useCallback(async () => {
        const trimmed = question.trim()
        if (!trimmed || isLoading) return

        appendMessage({
            id: generateId(),
            sender: 'user',
            text: trimmed,
            timestamp: new Date()
        })
        setQuestion('')
        setIsLoading(true)

        try {
            const data = await service.askQuestion(trimmed)
            appendMessage({
                id: generateId(),
                sender: 'assistant',
                text: data.answer,
                sources: data.sources,
                timestamp: new Date()
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Falha na comunicação com a API'
            appendMessage({ id: generateId(), sender: 'assistant', text: `Error: ${message}`, timestamp: new Date() })
        }
        finally {
            setIsLoading(false)
        }
    }, [question, isLoading, service, appendMessage])

    return { messages, question, setQuestion, isLoading, sendQuestion }
}