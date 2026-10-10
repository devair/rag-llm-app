import { useCallback, useEffect, useRef, useState } from "react"
import type { IChatService } from "../../../services/interfaces/IChatService"
import { chatService } from "../../../services/serviceContainer"
import type { ChatMessage } from "../../../types/api"
import { generateId } from "../../../utils/uuid"


interface UseChatOptions {
    service?: IChatService
    /** true (padrão) = resposta em streaming via SSE; false = resposta única via POST /api/chat. */
    stream?: boolean
}

/**
 * Lógica de estado do chat (SRP): a UI apenas consome este hook,
 * sem conhecer HTTP, tipos de resposta ou montagem de mensagens.
 *
 * No modo streaming, a bolha do assistente é criada vazia e recebe
 * cada token gerado pelo modelo em tempo real (SSE).
 */
export function useChat({ service = chatService, stream = true }: UseChatOptions = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [question, setQuestion] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const abortRef = useRef<AbortController | null>(null)

    // Cancela qualquer stream em andamento quando o componente é desmontado.
    useEffect(() => () => abortRef.current?.abort(), [])

    const appendMessage = useCallback((message: ChatMessage) => {
        setMessages((prev) => [...prev, message])
    }, [])

    const updateMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
        setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)))
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
            if (stream) {
                // Modo SSE: cria a mensagem do assistente e vai preenchendo token a token.
                const assistantId = generateId()
                appendMessage({
                    id: assistantId,
                    sender: 'assistant',
                    text: '',
                    timestamp: new Date(),
                    isStreaming: true
                })

                const controller = new AbortController()
                abortRef.current = controller

                let streamedText = ''
                await service.askQuestionStreaming(trimmed, {
                    signal: controller.signal,
                    onToken: (token) => {
                        streamedText += token
                        updateMessage(assistantId, { text: streamedText })
                    },
                    onSources: (sources) => {
                        updateMessage(assistantId, { sources })
                    }
                })

                updateMessage(assistantId, { isStreaming: false })
            } else {
                const data = await service.askQuestion(trimmed)
                appendMessage({
                    id: generateId(),
                    sender: 'assistant',
                    text: data.answer,
                    sources: data.sources,
                    timestamp: new Date()
                })
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Falha na comunicação com a API'
            appendMessage({ id: generateId(), sender: 'assistant', text: `Error: ${message}`, timestamp: new Date() })
        }
        finally {
            abortRef.current = null
            setIsLoading(false)
        }
    }, [question, isLoading, service, stream, appendMessage, updateMessage])

    return { messages, question, setQuestion, isLoading, sendQuestion }
}