import { useMemo } from "react"
import type { Session } from "../../types/api"

interface SessionSidebarProps {
    sessions: Session[]
    selectedSessionId: string | null
    isLoading: boolean
    error: string | null
    createError: string | null
    isLibraryActive: boolean
    onSelectSession: (session: Session) => void
    onNewConversation: () => void
    onOpenLibrary: () => void
}

export function SessionSidebar({
    sessions,
    selectedSessionId,
    isLoading,
    error,
    createError,
    isLibraryActive,
    onSelectSession,
    onNewConversation,
    onOpenLibrary
}: SessionSidebarProps) {
    const recentSessions = useMemo(
        () => [...sessions].sort(
            (first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt)
        ),
        [sessions]
    )

    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand">Assistente RAG</div>
            <nav className="sidebar-navigation" aria-label="Navegação principal">
                <button
                    type="button"
                    className="sidebar-navigation-button"
                    onClick={onNewConversation}
                >
                    <span aria-hidden="true">✎</span>
                    Nova conversa
                </button>
                <button
                    type="button"
                    className={`sidebar-navigation-button${isLibraryActive ? " active" : ""}`}
                    onClick={onOpenLibrary}
                    aria-pressed={isLibraryActive}
                >
                    <span aria-hidden="true">▦</span>
                    Biblioteca
                </button>
            </nav>

            {createError && (
                <p className="feedback-msg feedback-error sidebar-error" role="alert">{createError}</p>
            )}

            <div className="sidebar-sessions-heading">Sessões recentes</div>
            {error && <p className="feedback-msg feedback-error sidebar-error" role="alert">{error}</p>}
            {isLoading ? (
                <p className="sidebar-empty" role="status">Carregando sessões...</p>
            ) : recentSessions.length === 0 ? (
                <p className="sidebar-empty">Nenhuma sessão recente.</p>
            ) : (
                <ul className="sidebar-session-list">
                    {recentSessions.map((session) => (
                        <li key={session.id}>
                            <button
                                type="button"
                                className={`sidebar-session-button${selectedSessionId === session.id ? " active" : ""}`}
                                onClick={() => onSelectSession(session)}
                                aria-current={selectedSessionId === session.id ? "page" : undefined}
                            >
                                <span>{session.title || session.userId}</span>
                                <small>{new Date(session.updatedAt).toLocaleDateString()}</small>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    )
}
