import type { FormEvent } from "react"

interface ChatFormProps {
    question: string
    isLoading: boolean
    onQuestionChange: (value: string) => void
    onSubmit: () => void
}


/** Formulário controlado do chat — sem lógica de negócio. */
export function ChatForm({ question, isLoading, onQuestionChange, onSubmit }: ChatFormProps) {
    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        onSubmit()
    }
    return (
        <form onSubmit={handleSubmit} className="chat-form">
            <input
                type="text"
                value={question}
                onChange={(event) => onQuestionChange(event.target.value)}
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !question.trim()}>
                Enviar
            </button>
        </form>
    )
}