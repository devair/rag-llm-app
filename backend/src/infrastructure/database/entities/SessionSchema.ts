import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity('sessions')
export class SessionSchema {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text' })
    userId!: string;

    @Column({ type: 'text', default: 'Nova conversa' })
    title!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity("session_messages")
export class SessionMessageSchema {
    @PrimaryGeneratedColumn("uuid")
    id!: string

    @Column({ type: "uuid" })
    sessionId!: string

    @Column({ type: "varchar" })
    role!: "user" | "assistant"

    @Column({ type: "text" })
    content!: string

    @CreateDateColumn()
    createdAt!: Date
}
