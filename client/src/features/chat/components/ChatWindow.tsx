import type { ChatMessage } from '../../../types/api'
import { MessageBubble } from "./MessageBubble"

export interface ChatWindowProps {
    messages: ChatMessage[]
    isLoading: boolean
    isLoadingHistory: boolean
    endRef: React.RefObject<HTMLDivElement | null>
}

export function ChatWindow({ messages, isLoading, isLoadingHistory, endRef }: ChatWindowProps) {
    return (
        <div className="chat-window" ref={endRef}>
            {isLoadingHistory && (
                <p className="empty-text" role="status">Carregando histórico...</p>
            )}
            {!isLoadingHistory && messages.length === 0 && !isLoading && (
                <p className="empty-chat">Nenhuma mensagem nesta sessão.</p>
            )}
            {messages
                .filter((message) => !(isLoading && message.sender === "assistant" && !message.text))
                .map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

            {isLoading && (
                <div className="chat-typing" role="status" aria-label="Gerando resposta">
                    <span />
                    <span />
                    <span />
                </div>
            )}
        </div>
    )
}
