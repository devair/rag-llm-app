# RAG LLM App

Aplicação de **Retrieval-Augmented Generation (RAG)** construída com Node.js, TypeScript, PostgreSQL (pgvector), Redis (BullMQ) e Ollama para execução local de LLMs.

## 📋 Visão Geral

Esta aplicação permite:
- **Ingestão de documentos** (PDF, DOCX, HTML, TXT) com processamento assíncrono via fila
- **Busca vetorial** usando embeddings locais (Ollama)
- **Chat RAG** - responde perguntas baseadas nos documentos ingeridos
- **Arquitetura limpa** com separação de domínio, casos de uso e infraestrutura

## 🏗️ Arquitetura do Backend

```
backend/src/
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

## 🖥️ Arquitetura do Client

O frontend está em `client/` e é uma SPA construída com React, TypeScript e Vite. A interface é organizada por funcionalidades: cada feature mantém seu container, componentes de apresentação e hooks de estado. A comunicação HTTP fica isolada em serviços, que implementam contratos para que a UI não dependa diretamente dos endpoints.

```text
client/src/
├── App.tsx                         # Composição da tela principal
├── main.tsx                        # Inicialização do React
├── features/
│   ├── chat/
│   │   ├── ChatSection.tsx         # Container da feature de chat
│   │   ├── components/             # Formulário, janela e balões de mensagem
│   │   └── hooks/                  # Estado do chat e rolagem automática
│   └── ingestion/
│       ├── IngestionPanel.tsx      # Container de upload e status dos jobs
│       ├── components/             # Formulário, lista de jobs e badges de status
│       └── hooks/                  # Upload e polling dos jobs
├── services/
│   ├── interfaces/                 # Contratos de chat e ingestão
│   ├── httpClient.ts               # Requisições JSON, upload e consumo NDJSON
│   ├── HttpChatService.ts          # Integração com endpoints de chat
│   ├── HttpIngestionService.ts     # Integração com endpoints de ingestão
│   └── serviceContainer.ts          # Instâncias dos serviços da aplicação
├── shared/components/              # Componentes reutilizáveis, como Card
├── config/apiConfig.ts             # URL base da API por ambiente
├── types/api.ts                    # Tipos compartilhados das respostas da API
├── styles/                         # Estilos globais
└── utils/                          # Utilitários compartilhados
```

### Responsabilidades e fluxos

- **`App.tsx`** organiza a tela principal e monta as features de chat e ingestão.
- **Chat:** `ChatSection` conecta o hook `useChat` aos componentes visuais. O hook delega as chamadas ao `IChatService`; `HttpChatService` usa o `httpClient` para enviar perguntas e consumir tokens NDJSON de `POST /api/chat/stream`, atualizando a resposta enquanto ela é gerada.
- **Ingestão:** `IngestionPanel` conecta `useDocumentUpload` ao formulário de upload e `useJobTracking` à lista de jobs. O serviço de ingestão envia o arquivo como `FormData` e consulta o status dos jobs periodicamente até que terminem.
- **Serviços:** `serviceContainer.ts` centraliza as implementações HTTP. As interfaces permitem substituir ou simular os serviços sem acoplar os componentes às chamadas de rede.
- **Configuração e apresentação:** `apiConfig.ts` escolhe a URL da API para desenvolvimento ou produção; `types/api.ts` define os contratos de dados; `styles/` reúne a aparência compartilhada.

## 🔧 Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 20+ / TypeScript |
| API HTTP | Express 5 |
| Vetor DB | PostgreSQL + pgvector |
| Fila | Redis + BullMQ |
| LLM Local | Ollama (embeddings: `nomic-embed-text`, chat: `llama3:latest`) |
| Parsers | pdf-parse, mammoth (DOCX), jsdom (HTML) |
| Client | React 19, TypeScript, Vite |
| Servidor do Client | Nginx (arquivos estáticos e proxy `/api`) |
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

Os serviços `app` e `worker` compartilham `backend/uploads` para que os arquivos enviados pela API estejam disponíveis ao processamento em segundo plano. Após alterar a configuração dos volumes, recrie os containers com `docker compose up -d --build --force-recreate app worker`.

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

# Em outro terminal, inicia o client Vite
cd ../client
npm install
npm run dev
```

Na execução local, o Vite disponibiliza o frontend e `apiConfig.ts` aponta para `http://localhost:3000`. No Docker, o build do Vite é servido pelo Nginx, que encaminha `/api/` para o serviço `app`.

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

Para receber a resposta incrementalmente, use:

```bash
POST /api/chat/stream
Content-Type: application/json
Accept: application/x-ndjson

{ "question": "Qual é o conteúdo do documento sobre X?" }
```

O endpoint envia eventos NDJSON à medida que o Ollama gera o texto: primeiro blocos de texto (`{"type":"token","token":"..."}`), depois as fontes consultadas (`{"type":"sources","sources":[...]}`) e, ao terminar, `{"type":"done"}`. O endpoint JSON `POST /api/chat` continua disponível para clientes existentes.

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

1. **Cliente** envia pergunta via `POST /api/chat/stream`
2. **QueryRagUseCase**:
   - Gera embedding da pergunta
   - Busca top-4 chunks mais similares no pgvector
   - Constrói contexto com chunks encontrados
3. **OllamaService** chama Ollama (`llama3:latest`) em modo streaming e encaminha cada bloco gerado para o controller.
4. **ChatController** responde como NDJSON; o Nginx desativa buffering para que os blocos cheguem ao cliente sem esperar o fim da resposta.
5. **Cliente** acrescenta cada bloco à mensagem em exibição e mostra as fontes consultadas.

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

No diretório `client/`:

```bash
npm run dev            # Servidor de desenvolvimento Vite
npm run build          # Verifica os tipos e gera o build de produção
npm run preview        # Serve localmente o build de produção
npm run lint           # Executa ESLint
```

## 📝 Notas

- O volume `uploads_data` é compartilhado entre app e worker para acesso aos arquivos temporários
- O Ollama baixa modelos na primeira execução (pode levar alguns minutos)
- Para produção, configure variáveis de ambiente seguras e use volumes persistentes
- A busca vetorial usa cosine similarity via extensão `pgvector` do PostgreSQL

## 📄 Licença

MIT