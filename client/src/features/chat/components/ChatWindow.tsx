import type { RefObject } from "react"
import type { ChatMessage } from "../../../types/api"
import { MessageBubble } from "./MessageBubble"

interface ChatWindowProps {
    messages: ChatMessage[]
    isLoading: boolean
    endRef: RefObject<HTMLDivElement | null>

}

/** Janela de mensagens do chat — apenas composição visual. */
export function ChatWindow({ messages, isLoading, endRef }: ChatWindowProps) {

    // No modo streaming, a própria bolha do assistente mostra o cursor piscante,
    // então o placeholder "gerando..." só aparece antes do primeiro token.
    const hasStreamingMessage = messages.some((message) => message.isStreaming)

    return (
        <div className="chat-window">
            {messages.length === 0 ? (
                <div className="empty-chat">
                    Envie uma mensagem para consultar a base de conhecimento
                </div>
            ) : (
                messages.map((message) => <MessageBubble key={message.id}
                    message={message} />)
            )}
            {isLoading && !hasStreamingMessage && (
                <div className="message-bubble assistant loading">
                    <span>Analisando contexto e gerando resposta...</span>
                </div>
            )}
            <div ref={endRef} />
        </div>
    )
}