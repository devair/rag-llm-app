import { Repository } from "typeorm"
import { IngestionJob } from "../../domain/entities/IngestionJob"
import { IIngestionJobRepository } from "../../domain/interfaces/IIngestionJobRepository"
import { IngestionJobSchema } from "../database/entities/IngestionJobSchema"
import { AppDataSource } from "../database/typeorm.config"

export class IngestionJobRepository implements IIngestionJobRepository {

    private repo: Repository<IngestionJobSchema>

    constructor() {
        this.repo = AppDataSource.getRepository(IngestionJobSchema)
    }

    async create(job: IngestionJob): Promise<void> {
        const entity = this.repo.create(job)
        await this.repo.save(entity)
    }

    async update(job: IngestionJob): Promise<void> {
        await this.repo.save(job)
    }

    async findById(id: string): Promise<IngestionJob | null> {
        const entity = await this.repo.findOne({ where: { id } })
        if (!entity) return null

        return new IngestionJob(
            entity.id,
            entity.fileName,
            entity.filePath,
            entity.mimeType,
            entity.originalName,
            entity.status,
            entity.errorMessage,
            entity.createdAt,
            entity.updatedAt
        )
    }

}