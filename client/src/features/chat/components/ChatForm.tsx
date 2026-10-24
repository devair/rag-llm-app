
export interface ChatFormProps {
    question: string
    isLoading: boolean
    onQuestionChange: (value: string) => void
    onSubmit: (e: React.FormEvent) => void
    isStreaming?: boolean
}

export function ChatForm({
    question,
    isLoading,
    onQuestionChange,
    onSubmit,
    isStreaming = false
}: ChatFormProps) {
    return (
        <div className="chat-form">
            <input
                type="text"
                placeholder="Digite sua pergunta..."
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        onSubmit(e)
                    }
                }}
                disabled={isLoading}
                className="chat-input"
            />
            <button
                type="submit"
                onClick={onSubmit}
                disabled={isLoading}
                className="chat-submit-btn"
            >
                {isLoading ? 'Processando...' : 'Enviar'}
            </button>

            {isStreaming && (
                <div className="stream-indicator">
                    <span className="stream-text">Resposta sendo gerada...</span>
                </div>
            )}
        </div>
    )
}
