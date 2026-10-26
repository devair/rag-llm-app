import { useCallback, useState } from "react"
import { KnowledgeBaseSection } from "./features/knowledge-base/KnowledgeBaseSection"
import { SessionSection } from "./features/session/SessionSection"
import { SessionSidebar } from "./features/session/SessionSidebar"
import { useSessions } from "./features/session/hooks/useSessions"
import type { Session } from "./types/api"

type AppSection = "sessions" | "administration"

function App() {
  const [activeSection, setActiveSection] = useState<AppSection>("sessions")
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null)
  const {
    sessions,
    isLoading,
    isCreating,
    error,
    createError,
    createSession,
    reloadSessions
  } = useSessions()
  const handleNewConversation = useCallback(() => {
    setSelectedSession(null)
    setInitialQuestion(null)
    setActiveSection("sessions")
  }, [])
  const handleStartConversation = useCallback(async (question: string) => {
    const session = await createSession()
    if (!session) return false
    setSelectedSession(session)
    setInitialQuestion(question)
    setActiveSection("sessions")
    return true
  }, [createSession])
  const handleInitialQuestionSent = useCallback(() => {
    setInitialQuestion(null)
  }, [])

  return (
    <div className="app-shell">
      <SessionSidebar
        sessions={sessions}
        selectedSessionId={selectedSession?.id ?? null}
        isLoading={isLoading}
        error={error}
        createError={createError}
        isLibraryActive={activeSection === "administration"}
        onSelectSession={(session) => {
          setSelectedSession(session)
          setActiveSection("sessions")
        }}
        onNewConversation={handleNewConversation}
        onOpenLibrary={() => setActiveSection("administration")}
      />
      <main className="app-main">
        {activeSection === "sessions" ? (
          <SessionSection
            selectedSession={selectedSession}
            sessions={sessions}
            onSessionUpdated={() => reloadSessions(false)}
            initialQuestion={initialQuestion}
            isCreatingSession={isCreating}
            createSessionError={createError}
            onStartConversation={handleStartConversation}
            onInitialQuestionSent={handleInitialQuestionSent}
          />
        ) : (
          <KnowledgeBaseSection />
        )}
      </main>
    </div>
  )
}

export default App
