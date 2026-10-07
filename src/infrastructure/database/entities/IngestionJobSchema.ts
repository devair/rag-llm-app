import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { JobStatus } from "../../../domain/entities/IngestionJob"

@Entity('ingestion_jobs')
export class IngestionJobSchema {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  fileName!: string;

  @Column({ type: 'text' })
  filePath!: string;

  @Column({ type: 'text' })
  mimeType!: string;

  @Column({ type: 'text' })
  originalName!: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: JobStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}