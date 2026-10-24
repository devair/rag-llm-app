import { Message, Session } from "../entities/Session"

export interface ISessionRepository {
    findById(id: string): Promise<Session | null>;
    findAll(): Promise<Session[]>;
    create(session: Partial<Session>): Promise<Session>;
    update(session: Partial<Session>): Promise<void>;
    updateTitleIfDefault(sessionId: string, title: string): Promise<boolean>;
    delete(id: string): Promise<void>;
    getMessages(sessionId: string): Promise<Message[]>;
    createMessage(sessionId: string, content: string, role: Message["role"]): Promise<Message | null>;
    updateMessage(sessionId: string, messageId: string, content: string, role: Message["role"]): Promise<Message | null>;
    deleteMessage(sessionId: string, messageId: string): Promise<boolean>;
}
