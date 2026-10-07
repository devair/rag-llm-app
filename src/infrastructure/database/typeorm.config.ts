import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { DocumentChunkSchema } from './entities/DocumentChunkSchema'
import { IngestionJobSchema } from './entities/IngestionJobSchema'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  database: process.env.DB_NAME || 'rag_db',
  synchronize: true, // Apenas para dev; cria a tabela automaticamente
  logging: false,
  entities: [DocumentChunkSchema, IngestionJobSchema],
})

/**
 * Garante que a extensão pgvector exista sem quebrar por condição de corrida (race condition)
 */
export async function ensureVectorExtension() {
  try {
    await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS "vector"')
  } catch (error: any) {
    // Se o erro for de duplicidade por concorrência (código Postgres 23505), ignora suavemente
    if (error.code === '23505' || error.message?.includes('already exists')) {
      console.log('[PostgreSQL] Extensão pgvector já criada por outro serviço.')
    } else {
      throw error
    }
  }
}

/**
 * Função utilitária para inicializar a conexão e preparar o banco
 */
export async function initializeDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
    console.log('[Database] Conexão com PostgreSQL estabelecida com sucesso.')

    // Chama a garantia da extensão logo após a conexão ser estabelecida
    await ensureVectorExtension()
  }
}