# CLAUDE.md

Proxy API between **OpenClaw** and **SeuFisio** for the MovArt Pilates studio.

## Commands

```bash
npm run dev     # tsx watch src/index.ts (hot reload)
npm run build   # tsc → dist/
npm start       # node dist/index.js
```

There is no test or lint script configured.

## Architecture

Express + TypeScript proxy. Requests come in from OpenClaw, get authenticated, then are
forwarded to the upstream SeuFisio API (with normalization/business rules applied here).

- `src/index.ts` — app bootstrap, route mounting, health check, global error handler.
- `src/config/env.ts` — env loading/validation via `dotenv`. All required vars throw on startup if missing. Import the `env` object; do not read `process.env` directly elsewhere.
- `src/middleware/auth.ts` — `secretTokenAuth`, applied to **all** `/api` routes. Validates `API_SECRET_TOKEN`.
- `src/services/seufisio-auth.ts` — obtains/caches the SeuFisio auth token.
- `src/services/seufisio-client.ts` — shared axios client for upstream SeuFisio calls.
- `src/routes/*.ts` — one router per domain (clients, sales, professionals, attendances, reposicao, attendance-types, customers, calendar, charges, plans, nf).

### Routes (mounted in `src/index.ts`)

| Mount | Router |
|---|---|
| `/health` | health check, **no auth** |
| `/api/clients` | `clients`, `sales` (both mounted here) |
| `/api/professionals` | `professionals` |
| `/api/attendances` | `attendances` |
| `/api/reposicao` | `reposicao` |
| `/api/attendance-types` | `attendance-types` |
| `/api/customers` | `customers` |
| `/api/calendar` | `calendar` |
| `/api/charges` | `charges` |
| `/api/plans` | `plans` |
| `/api/seufisio` | `nf` |

## Environment

Copy `.env.example` → `.env`. Required: `SEUFISIO_USER`, `SEUFISIO_PASSWORD`,
`SEUFISIO_CLIENT_SECRET`, `API_SECRET_TOKEN`. Optional: `SEUFISIO_CLINIC_ID` (default `9208`),
`MAX_ATTENDANCES_PER_HOUR` (default `4`), `PORT` (default `3000`).

## Conventions

- All business/proxy endpoints live under `/api` and require the secret token.
- New upstream calls should go through `services/seufisio-client.ts` (reuses auth token).
- To add a domain: create `src/routes/<name>.ts`, then import and `app.use()` it in `src/index.ts`.
- The `.md` files at the repo root (`clients.md`, `create-atendimento-reposicao.md`, etc.) are API/behavior specs for the SeuFisio endpoints — consult them when implementing a route.
