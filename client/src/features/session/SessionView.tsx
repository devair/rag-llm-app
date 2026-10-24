import { useState, type FormEvent } from "react"
import type { SessionMessage } from "../../types/api"

interface SessionViewProps {
    sessionId: string
    messages: SessionMessage[]
    isLoading: boolean
    isSending: boolean
    error: string | null
    onBack: () => void
    onSend: (content: string) => Promise<boolean>
}

export function SessionView({
    sessionId,
    messages,
    isLoading,
    isSending,
    error,
    onBack,
    onSend
}: SessionViewProps) {
    const [content, setContent] = useState("")

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const trimmedContent = content.trim()
        if (!trimmedContent || isSending) return

        if (await onSend(trimmedContent)) {
            setContent("")
        }
    }

    return (
        <section className="session-view" aria-label={`Sessão ${sessionId}`}>
            <button type="button" className="session-back" onClick={onBack}>
                Voltar às sessões
            </button>
            <div className="chat-window messages-container" aria-live="polite">
                {isLoading ? (
                    <p className="empty-text" role="status">Carregando mensagens...</p>
                ) : messages.length === 0 ? (
                    <p className="empty-chat">Nenhuma mensagem nesta sessão.</p>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className={`message-bubble ${message.role}`}>
                            <p className="message-text">{message.content}</p>
                        </div>
                    ))
                )}
            </div>
            {error && <p className="feedback-msg feedback-error" role="alert">{error}</p>}
            <form className="chat-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Digite uma mensagem..."
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    disabled={isSending}
                    aria-label="Mensagem"
                />
                <button type="submit" disabled={isSending || !content.trim()}>
                    {isSending ? "Enviando..." : "Enviar"}
                </button>
            </form>
        </section>
    )
}
