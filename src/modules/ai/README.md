# AgenticAI – Backend Module

A production-grade, streaming AI assistant module for the Agentic Admin Platform.

## Overview

The AI module lives at `src/modules/ai/` and provides:

- **Real-time streaming** via Socket.io WebSocket gateway (`/ai` namespace)
- **Agentic tool-calling** with the OpenAI GPT-4.1 model (via GitHub Models)
- **Conversation persistence** in PostgreSQL
- **9 built-in tools**: database queries, schema reader, file reader, DTO analyzer, controller analyzer, React form analyzer, user creation, role fetcher
- **Security**: JWT auth on every socket connection, read-only SQL enforcement, column blacklisting, rate limiting (60 req/min), prompt injection protection
- **Audit logging** via `ai_audit_logs` table

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.development` and fill in your values:

```bash
cp .env.example .env.development
```

**Required variables:**

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | GitHub Personal Access Token with `models:read` scope (for GitHub Models / GPT-4.1) |
| `JWT_SECRET` | Must match the secret used for auth tokens |
| `DB_*` | PostgreSQL connection settings |

### 3. Get a GitHub Token for GPT-4.1

1. Go to https://github.com/settings/tokens
2. Generate a new token (classic) with **no special scopes** required
3. Paste it as `GITHUB_TOKEN` in your `.env.development`

> The AI module uses the GitHub Models endpoint: `https://models.inference.ai.azure.com` with model `gpt-4.1`

### 4. Start the server

```bash
npm run start:dev
```

The AI WebSocket gateway is available at `ws://localhost:3000/ai`.

## Architecture

```
src/modules/ai/
├── ai.module.ts              # Module registration
├── controllers/
│   └── ai.controller.ts      # REST: GET/PUT/DELETE conversations, usage stats
├── services/
│   └── ai.service.ts         # Core agentic loop (streaming, tool execution)
├── gateway/
│   └── ai.gateway.ts         # Socket.io gateway (JWT auth, rate limiting)
├── tools/
│   ├── postgres.tool.ts      # SQL query executor + schema reader
│   ├── file-reader.tool.ts   # Secure file system reader
│   ├── dto-analyzer.tool.ts  # TypeScript DTO parser
│   ├── api-route-analyzer.tool.ts # NestJS controller parser
│   ├── react-form-analyzer.tool.ts # React form field extractor
│   ├── user-creation.tool.ts # User creation with validation
│   └── prompt-builder.tool.ts # Dynamic system prompt construction
├── entities/
│   ├── conversation.entity.ts  # Chat history (PostgreSQL JSONB)
│   └── ai_audit_log.entity.ts  # Tool call audit trail
├── dto/
│   ├── create-message.dto.ts
│   └── conversation.dto.ts
├── utils/
│   ├── sql-validator.ts      # Read-only SQL enforcement
│   └── safe-execution.ts     # Timeout + error wrapper
└── middlewares/
    └── ai-access.guard.ts    # HTTP + WebSocket auth guards
```

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `message` | `{ message: string, conversation_id?: string }` | Send a user message |
| `ping` | — | Heartbeat check |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `connected` | `{ userId }` | Auth successful |
| `conversation_id` | `{ conversation_id }` | New conversation created |
| `thinking` | `{ status: true }` | AI is processing |
| `stream_start` | `{ timestamp }` | Response starting |
| `stream_chunk` | `{ content: string }` | Streaming token |
| `tool_call` | `{ name, status }` | Tool executing/done |
| `stream_end` | `{ content, timestamp }` | Response complete |
| `stream_error` | `{ message }` | Error during streaming |

## REST Endpoints

All endpoints require `Authorization: Bearer <jwt>` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/ai/conversations` | List user conversations |
| `GET` | `/api/ai/conversations/:id` | Get conversation with messages |
| `POST` | `/api/ai/conversations` | Create new conversation |
| `PUT` | `/api/ai/conversations/:id` | Update title / pin / archive |
| `DELETE` | `/api/ai/conversations/:id` | Delete conversation |
| `GET` | `/api/ai/usage` | Get token usage stats |

## SQL Safety Rules

The AI can **only** run `SELECT`, `COUNT`, and aggregation queries.

**Permanently blocked:** `UPDATE`, `DELETE`, `DROP`, `ALTER`, `INSERT`, `TRUNCATE`, `CREATE`, `EXEC`, `GRANT`, `REVOKE`

**Blacklisted columns (never returned):** `password`, `refresh_token`, `access_token`, `otp`, `secret_key`, `hash`, `salt`, `private_key`, `api_key`, `token`

## File Analysis Scope

The AI can read files only within:
- `D:\Malik\agentic_ui\src`
- `D:\Malik\agentic_api\src`

Allowed extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`, `.css`, `.html`, `.sql`
Max file size: 100KB

## Rate Limiting

- 60 requests per minute per authenticated user
- Token-based monitoring (logged in `ai_audit_logs`)
- WebSocket flood protection via per-connection rate map
