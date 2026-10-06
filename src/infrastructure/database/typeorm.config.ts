import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DocumentChunkSchema } from './entities/DocumentChunkSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  database: process.env.DB_NAME || 'rag_db',
  synchronize: true, // Apenas para dev; cria a tabela automaticamente
  logging: false,
  entities: [DocumentChunkSchema],
});

export const initializeDatabase = async () => {
  await AppDataSource.initialize();
  // Habilita a extensão pgvector caso ela ainda não esteja ativa no banco
  await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS vector;');
};