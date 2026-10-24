import type { ChatMessage } from "../../../types/api"
import { RichText } from "./RichText"

interface MessageBubbleProps {
    message: ChatMessage
}

/** Componente de apresentação pura de uma mensagem do chat. */
export function MessageBubble({ message }: MessageBubbleProps) {

    return (
        <div className={`message-bubble ${message.sender}`}>
            {message.sender === "assistant" ? (
                <RichText text={message.text} />
            ) : (
                <div className="message-text">{message.text}</div>
            )}
            {message.sources && message.sources.length > 0 && (
                <div className="source-box">
                    <strong>Fontes consultadas:</strong>
                    <ul>
                        {message.sources.map((source, index) => (
                            <li key={index}>{source}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}