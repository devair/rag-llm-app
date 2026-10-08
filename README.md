# RAG LLM App

Aplicação de **Retrieval-Augmented Generation (RAG)** construída com Node.js, TypeScript, PostgreSQL (pgvector), Redis (BullMQ) e Ollama para execução local de LLMs.

## 📋 Visão Geral

Esta aplicação permite:
- **Ingestão de documentos** (PDF, DOCX, HTML, TXT) com processamento assíncrono via fila
- **Busca vetorial** usando embeddings locais (Ollama)
- **Chat RAG** - responde perguntas baseadas nos documentos ingeridos
- **Arquitetura limpa** com separação de domínio, casos de uso e infraestrutura

## 🏗️ Arquitetura

```
src/
├── domain/                 # Camada de domínio (regras de negócio)
│   ├── entities/           # Entidades: IngestionJob, DocumentChunk
│   └── interfaces/         # Contratos: IVectorRepository, ILLMService, IIngestionJobRepository
├── use-cases/              # Casos de uso da aplicação
│   ├── EnqueueIngestionUseCase.ts      # Enfileira job de ingestão
│   ├── ProcessIngestionJobUseCase.ts   # Processa documento (parse, chunk, embed, save)
│   ├── QueryRagUseCase.ts              # Busca vetorial + geração de resposta
│   └── IngestDocumentUseCase.ts        # Orquestração de ingestão
├── infrastructure/         # Implementações técnicas
│   ├── database/           # TypeORM + PostgreSQL (pgvector)
│   ├── repositories/       # VectorRepository, IngestionJobRepository
│   ├── services/           # OllamaService, DocumentParserFactory
│   ├── queue/              # BullMqQueueProvider (Redis)
│   └── https/controllers/  # IngestController, CheckJobStatusController
├── main/
│   └── server.ts           # Bootstrap do Express + rotas
└── infrastructure/queue/worker.ts  # Worker BullMQ para processar jobs
```

## 🔧 Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 20+ / TypeScript |
| API HTTP | Express 5 |
| Vetor DB | PostgreSQL + pgvector |
| Fila | Redis + BullMQ |
| LLM Local | Ollama (embeddings: `nomic-embed-text`, chat: `llama3:latest`) |
| Parsers | pdf-parse, mammoth (DOCX), jsdom (HTML) |
| Container | Docker / Docker Compose |

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose
- (Opcional) GPU NVIDIA para aceleração do Ollama

### Com Docker Compose (Recomendado)

```bash
# Sobe todos os serviços: PostgreSQL, Redis, Ollama, App, Worker
docker-compose up -d --build

# Ver logs
docker-compose logs -f app
docker-compose logs -f worker

# Baixar os modelos para dentro do container do Ollama:
docker exec -it rag_ollama ollama pull nomic-embed-text
docker exec -it rag_ollama ollama pull llama3
```

Serviços expostos:
- **App (API)**: http://localhost:3000
- **Ollama**: http://localhost:11434
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Desenvolvimento Local

```bash
# Instala dependências
npm install

# Inicia infraestrutura (PostgreSQL, Redis, Ollama)
docker-compose up -d postgres redis ollama

# Roda servidor em modo watch
npm run dev:server

# Em outro terminal, roda worker em modo watch
npm run dev:worker
```

## 📡 Endpoints da API

### Ingestão de Documento
```bash
POST /api/ingest
Content-Type: multipart/form-data

# Campo: file (arquivo: PDF, DOCX, HTML, TXT)
```

**Resposta:**
```json
{ "jobId": "uuid-do-job" }
```

### Status do Job
```bash
GET /api/ingest/status/:jobId
```

**Resposta:**
```json
{
  "id": "uuid",
  "fileName": "documento.pdf",
  "status": "COMPLETED",  // PENDING | PROCESSING | COMPLETED | FAILED
  "errorMessage": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Chat RAG
```bash
POST /api/chat
Content-Type: application/json

{ "question": "Qual é o conteúdo do documento sobre X?" }
```

**Resposta:**
```json
{
  "answer": "Resposta gerada pelo LLM baseada nos documentos...",
  "sources": ["documento.pdf", "outro.docx"]
}
```

## ⚙️ Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3000` | Porta do servidor HTTP |
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USER` | `postgres` | Usuário do PostgreSQL |
| `DB_PASSWORD` | `postgrespassword` | Senha do PostgreSQL |
| `DB_NAME` | `rag_db` | Nome do banco |
| `REDIS_HOST` | `localhost` | Host do Redis |
| `REDIS_PORT` | `6379` | Porta do Redis |
| `OLLAMA_HOST` | `http://localhost:11434` | URL do Ollama |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Modelo de embedding |
| `OLLAMA_CHAT_MODEL` | `llama3:latest` | Modelo de chat |

## 📦 Formatos Suportados

| Extensão | Parser |
|----------|--------|
| `.pdf` | pdf-parse |
| `.docx` | mammoth |
| `.html`, `.htm` | jsdom |
| `.txt`, `.md` | Leitura direta (UTF-8) |

## 🔄 Fluxo de Ingestão

1. **Cliente** faz upload via `POST /api/ingest`
2. **Controller** salva arquivo temporário e chama `EnqueueIngestionUseCase`
3. **Use Case** cria `IngestionJob` (status `PENDING`) e enfileira no Redis via BullMQ
4. **Worker** (processo separado) consome job e executa `ProcessIngestionJobUseCase`:
   - Atualiza status para `PROCESSING`
   - Parsing do arquivo conforme tipo MIME
   - Chunking do texto (1000 chars, overlap 200)
   - Gera embeddings via Ollama (`nomic-embed-text`)
   - Salva chunks + embeddings no pgvector
   - Remove arquivo temporário
   - Atualiza status para `COMPLETED` ou `FAILED`
5. **Cliente** consulta status via `GET /api/ingest/status/:jobId`

## 💬 Fluxo de Chat RAG

1. **Cliente** envia pergunta via `POST /api/chat`
2. **QueryRagUseCase**:
   - Gera embedding da pergunta
   - Busca top-4 chunks mais similares no pgvector
   - Constrói contexto com chunks encontrados
   - Chama Ollama (`llama3:latest`) com prompt RAG
   - Retorna resposta + fontes (nomes dos documentos)

## 📁 Estrutura de Dados

### DocumentChunk (pgvector)
```typescript
{
  id: string (UUID)
  documentName: string
  content: string
  embedding: vector(768)  // nomic-embed-text = 768 dimensões
}
```

### IngestionJob (PostgreSQL)
```typescript
{
  id: string (UUID)
  fileName: string
  filePath: string
  mimeType: string
  originalName: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}
```

## 🛠️ Scripts Disponíveis

```bash
npm run build          # Compila TypeScript
npm run start:server   # Inicia servidor compilado
npm run start:worker   # Inicia worker compilado
npm run dev:server     # Dev server com hot reload (tsx watch)
npm run dev:worker     # Dev worker com hot reload (tsx watch)
```

## 📝 Notas

- O volume `uploads_data` é compartilhado entre app e worker para acesso aos arquivos temporários
- O Ollama baixa modelos na primeira execução (pode levar alguns minutos)
- Para produção, configure variáveis de ambiente seguras e use volumes persistentes
- A busca vetorial usa cosine similarity via extensão `pgvector` do PostgreSQL

## 📄 Licença

MIT