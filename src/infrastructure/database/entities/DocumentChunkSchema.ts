import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity('document_chunks')
export class DocumentChunkSchema {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ type: 'varchar', length: 255 })
    documentName!: string

    @Column({ type: 'text' })
    content!: string

    @Column({ type: 'vector', spatialFeatureType: 'vector', precision: 768})
    embedding!: number[]

    @CreateDateColumn()
    createdAt!: Date
}