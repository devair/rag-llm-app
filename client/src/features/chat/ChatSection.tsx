import { Card } from '../../shared/components/Card'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useChat } from './hooks/useChat'
import { ChatForm } from './components/ChatForm'
import { ChatWindow } from './components/ChatWindow'

/**
 * Container da feature de chat: liga o hook de estado aos componentes
 * de apresentação. Não conhece detalhes de HTTP nem de layout global.
 */
export function ChatSection() {
    const { messages, question, setQuestion, isLoading, sendQuestion } = useChat()
    const endRef = useAutoScroll({ messages, isLoading })

    return (
        <Card className="chat-section" title="💬 Chat RAG">
            <ChatWindow messages={messages} isLoading={isLoading} endRef={endRef} />
            <ChatForm
                question={question}
                isLoading={isLoading}
                onQuestionChange={setQuestion}
                onSubmit={sendQuestion}
            />
        </Card>
    )
}