export class Session {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public title: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public readonly messages: Message[] = []
    ) {}

    addMessage(message: Message): void {
        this.messages.push(message)
        this.updatedAt = new Date()
    }
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sessionId: string;
}
