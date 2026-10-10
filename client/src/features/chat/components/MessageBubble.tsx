import type { ChatMessage } from "../../../types/api"

interface MessageBubbleProps {
    message: ChatMessage
}

/** Componente de apresentação pura de uma mensagem do chat. */
export function MessageBubble({ message }: MessageBubbleProps) {

    return (
        <div className={`message-bubble ${message.sender}`}>
            <div className="message-text">
                {message.text}
                {message.isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
            </div>
            {message.sources && message.sources.length > 0 && !message.isStreaming && (
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