
export interface ChatFormProps {
    question: string
    isLoading: boolean
    onQuestionChange: (value: string) => void
    onSubmit: (e: React.FormEvent) => void
}

export function ChatForm({
    question,
    isLoading,
    onQuestionChange,
    onSubmit
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
        </div>
    )
}
