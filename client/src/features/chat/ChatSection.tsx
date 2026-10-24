import { useEffect, useMemo, useRef } from 'react'
import type { SessionMessage } from '../../types/api'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useChat } from './hooks/useChat'
import { ChatForm } from './components/ChatForm'
import { ChatWindow } from './components/ChatWindow'

interface ChatSectionProps {
    sessionId: string
    sessionMessages: SessionMessage[]
    isLoadingSessionMessages: boolean
    sessionMessageError: string | null
    onSessionUpdated: () => Promise<void>
    initialQuestion?: string | null
    onInitialQuestionSent: () => void
}

/**
 * Container da feature de chat: liga o hook de estado aos componentes
 * de apresentação. Não conhece detalhes de HTTP nem de layout global.
 */
export function ChatSection({
    sessionId,
    sessionMessages,
    isLoadingSessionMessages,
    sessionMessageError,
    onSessionUpdated,
    initialQuestion,
    onInitialQuestionSent
}: ChatSectionProps) {
    const { messages, question, setQuestion, isLoading, error, sendQuestion } = useChat({ sessionId })
    const startedInitialQuestion = useRef(false)
    const handleSendQuestion = async () => {
        await sendQuestion()
        await onSessionUpdated()
    }
    useEffect(() => {
        if (!initialQuestion || isLoadingSessionMessages || startedInitialQuestion.current) return
        startedInitialQuestion.current = true
        void (async () => {
            await sendQuestion(initialQuestion)
            await onSessionUpdated()
        })()
        onInitialQuestionSent()
    }, [initialQuestion, isLoadingSessionMessages, onInitialQuestionSent, onSessionUpdated, sendQuestion])
    const displayedMessages = useMemo(() => [
        ...sessionMessages.map((message) => ({
            id: `session-${message.id}`,
            sender: message.role,
            text: message.content,
            timestamp: new Date(0)
        })),
        ...messages
    ], [messages, sessionMessages])
    const endRef = useAutoScroll({ messages: displayedMessages, isLoading })

    return (
        <section className="chat-section">
            {(error || sessionMessageError) && (
                <p className="feedback-msg feedback-error" role="alert">
                    {sessionMessageError ?? error}
                </p>
            )}
            <ChatWindow
                messages={displayedMessages}
                isLoading={isLoading}
                isLoadingHistory={isLoadingSessionMessages}
                endRef={endRef}
            />
            <ChatForm
                question={question}
                isLoading={isLoading}
                onQuestionChange={setQuestion}
                onSubmit={handleSendQuestion}
            />
        </section>
    )
}