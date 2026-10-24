import { ChatSection } from "../chat/ChatSection"
import type { Session } from "../../types/api"
import { useSessionMessages } from "./hooks/useSessionMessages"
import { useState, type FormEvent } from "react"

interface SessionSectionProps {
    selectedSession: Session | null
    onSessionUpdated: () => Promise<void>
    initialQuestion: string | null
    isCreatingSession: boolean
    createSessionError: string | null
    onStartConversation: (question: string) => Promise<boolean>
    onInitialQuestionSent: () => void
}

export function SessionSection({
    selectedSession,
    onSessionUpdated,
    initialQuestion,
    isCreatingSession,
    createSessionError,
    onStartConversation,
    onInitialQuestionSent
}: SessionSectionProps) {
    const [firstQuestion, setFirstQuestion] = useState("")
    const {
        messages,
        isLoading: isLoadingMessages,
        error: messageError
    } = useSessionMessages(selectedSession?.id ?? null)
    const handleStartConversation = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const question = firstQuestion.trim()
        if (!question || isCreatingSession) return
        if (await onStartConversation(question)) setFirstQuestion("")
    }

    return (
        <section className="session-section">
            {selectedSession && (
                <ChatSection
                    key={selectedSession.id}
                    sessionId={selectedSession.id}
                    sessionMessages={messages}
                    isLoadingSessionMessages={isLoadingMessages}
                    sessionMessageError={messageError}
                    onSessionUpdated={onSessionUpdated}
                    initialQuestion={initialQuestion}
                    onInitialQuestionSent={onInitialQuestionSent}
                />
            )}
            {!selectedSession && (
                <div className="session-welcome">
                    <h1>Como posso ajudar?</h1>
                    <form className="welcome-prompt" onSubmit={handleStartConversation}>
                        <input
                            value={firstQuestion}
                            onChange={(event) => setFirstQuestion(event.target.value)}
                            placeholder="Digite sua pergunta..."
                            aria-label="Digite sua pergunta"
                            disabled={isCreatingSession}
                        />
                        <button type="submit" disabled={isCreatingSession || !firstQuestion.trim()}>
                            {isCreatingSession ? "Iniciando..." : "Enviar"}
                        </button>
                    </form>
                    {createSessionError && (
                        <p className="feedback-msg feedback-error" role="alert">{createSessionError}</p>
                    )}
                    <p>Ou selecione uma sessão recente na lateral.</p>
                </div>
            )}
        </section>
    )
}
