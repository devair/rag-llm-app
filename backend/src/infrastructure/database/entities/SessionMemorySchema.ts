import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm"

@Entity("session_context_sessions")
@Index(["sessionId", "sourceSessionId"], { unique: true })
export class SessionContextSessionSchema {
    @PrimaryGeneratedColumn("uuid")
    id!: string

    @Column({ type: "uuid" })
    sessionId!: string

    @Column({ type: "uuid" })
    sourceSessionId!: string
}

@Entity("session_memory_chunks")
@Index(["messageId"], { unique: true })
@Index(["sourceSessionId"])
export class SessionMemoryChunkSchema {
    @PrimaryGeneratedColumn("uuid")
    id!: string

    @Column({ type: "uuid" })
    messageId!: string

    @Column({ type: "uuid" })
    sourceSessionId!: string

    @Column({ type: "varchar" })
    role!: "user" | "assistant"

    @Column({ type: "text" })
    content!: string

    @Column({ type: "vector", spatialFeatureType: "vector", precision: 768 })
    embedding!: number[]
}
