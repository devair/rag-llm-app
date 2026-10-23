import type { ChatMessage } from '../../../types/api'
import { MessageBubble } from "./MessageBubble"

export interface ChatWindowProps {
    messages: ChatMessage[]
    isLoading: boolean
    endRef: React.RefObject<HTMLDivElement | null>
}

export function ChatWindow({ messages, isLoading, endRef }: ChatWindowProps) {
    return (
        <div className="chat-window" ref={endRef}>
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
