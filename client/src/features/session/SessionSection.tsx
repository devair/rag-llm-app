import { ChatSection } from "../chat/ChatSection"
import type { Session } from "../../types/api"
import { useSessionMessages } from "./hooks/useSessionMessages"
import { useSessionContext } from "./hooks/useSessionContext"
import { useState, type FormEvent } from "react"

interface SessionSectionProps {
    selectedSession: Session | null
    sessions: Session[]
    onSessionUpdated: () => Promise<void>
    initialQuestion: string | null
    isCreatingSession: boolean
    createSessionError: string | null
    onStartConversation: (question: string) => Promise<boolean>
    onInitialQuestionSent: () => void
}

export function SessionSection({
    selectedSession,
    sessions,
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
    const {
        sessionIds: contextSessionIds,
        isLoading: isLoadingContext,
        isSaving: isSavingContext,
        error: contextError,
        update: updateContextSessions,
        retry: retryContextLoad
    } = useSessionContext(selectedSession?.id ?? null)
    const handleStartConversation = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const question = firstQuestion.trim()
        if (!question || isCreatingSession) return
        if (await onStartConversation(question)) setFirstQuestion("")
    }

    return (
        <section className="session-section">
            {selectedSession && (
                <>
                    <section className="session-context-selector" aria-labelledby="session-context-title">
                        <div>
                            <h2 id="session-context-title">Contexto de conversas anteriores</h2>
                            <p>Até 10 sessões selecionadas podem fornecer contexto às respostas.</p>
                        </div>
                        {isLoadingContext ? (
                            <p role="status">Carregando contexto...</p>
                        ) : (
                            <div className="session-context-options">
                                {sessions.filter((session) => session.id !== selectedSession.id).map((session) => (
                                    <label key={session.id}>
                                        <input
                                            type="checkbox"
                                            checked={contextSessionIds.includes(session.id)}
                                            disabled={isSavingContext || Boolean(contextError) ||
                                                (!contextSessionIds.includes(session.id) && contextSessionIds.length >= 10)}
                                            onChange={(event) => {
                                                const nextSessionIds = event.target.checked
                                                    ? [...contextSessionIds, session.id]
                                                    : contextSessionIds.filter((id) => id !== session.id)
                                                void updateContextSessions(nextSessionIds)
                                            }}
                                        />
                                        <span>{session.title || session.userId}</span>
                                    </label>
                                ))}
                                {sessions.length <= 1 && <p>Nenhuma outra sessão disponível.</p>}
                            </div>
                        )}
                        {isSavingContext && <p role="status">Salvando seleção...</p>}
                        {contextError && (
                            <div>
                                <p className="feedback-msg feedback-error" role="alert">{contextError}</p>
                                <button type="button" onClick={retryContextLoad}>Tentar novamente</button>
                            </div>
                        )}
                    </section>
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
                </>
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
