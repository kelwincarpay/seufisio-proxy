# CLAUDE.md

Proxy API between **OpenClaw** and **SeuFisio** for the MovArt Pilates studio.

## Commands

```bash
npm run dev     # tsx watch src/index.ts (hot reload)
npm run build   # tsc → dist/
npm start       # node dist/index.js
npm run har -- capturas/x.har --out docs/x.md   # HAR do DevTools -> spec markdown
```

`scripts/check-payloads.ts` confere as funções puras (payload do plano, desconto, cópia do
WhatsApp) contra os dados das capturas. Invocação no cabeçalho do arquivo.

There is no test or lint script configured.

## Architecture

Express + TypeScript proxy. Requests come in from OpenClaw, get authenticated, then are
forwarded to the upstream SeuFisio API (with normalization/business rules applied here).

- `src/index.ts` — app bootstrap, route mounting, health check, global error handler.
- `src/config/env.ts` — env loading/validation via `dotenv`. All required vars throw on startup if missing. Import the `env` object; do not read `process.env` directly elsewhere.
- `src/middleware/auth.ts` — `secretTokenAuth`, applied to **all** `/api` routes. Validates `API_SECRET_TOKEN`.
- `src/services/seufisio-auth.ts` — obtains/caches the SeuFisio auth token.
- `src/services/seufisio-client.ts` — shared axios client for upstream SeuFisio calls.
- `src/services/supabase.ts` / `evolution.ts` — Supabase (service-role) and the Evolution
  WhatsApp sender. Both optional: unset env disables the features that need them.
- `src/services/recurring-plans.ts` — `cliente-servico` (serviço recorrente): payload,
  price rule, schedule text. Distinct from `pacote`, which `routes/plans.ts` also serves.
- `src/services/contracts.ts` — contracts from templates + signature status.
- `src/services/charges.ts` — charge discount (full-object PUT).
- `src/services/onboarding*.ts` — post-sale state machine, its cron and its WhatsApp copy.
- `src/services/reminder-cron.ts` — class reminder sweep.
- `src/routes/*.ts` — one router per domain (clients, sales, professionals, attendances, reposicao, attendance-types, customers, calendar, charges, plans, nf, notifications, onboarding).

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
| `/api/notifications` | `notifications` (class reminders) |
| `/api/onboarding` | `onboarding` (post-sale flow) |

## Environment

Copy `.env.example` → `.env`. Required: `SEUFISIO_USER`, `SEUFISIO_PASSWORD`,
`SEUFISIO_CLIENT_SECRET`, `API_SECRET_TOKEN`. Optional: `SEUFISIO_CLINIC_ID` (default `9208`),
`MAX_ATTENDANCES_PER_HOUR` (default `4`), `PORT` (default `3000`).

WhatsApp features (reminders + onboarding) need `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` and `EVOLUTION_API_URL` / `_KEY` / `_INSTANCE`. Without them
the routes answer 503 and both crons log and stay off. Schedules and windows:
`NOTIFICATIONS_CRON`, `NOTIFY_LOOKAHEAD_DAYS`, `ONBOARDING_CRON`,
`ONBOARDING_RESEND_HOURS`, `MODELO_CONTRATO_CLIENTE_ID`, `MODELO_CONTRATO_TERMO_ID`.

Supabase DDL lives in `supabase/*.sql`.

## Conventions

- All business/proxy endpoints live under `/api` and require the secret token.
- New upstream calls should go through `services/seufisio-client.ts` (reuses auth token).
- To add a domain: create `src/routes/<name>.ts`, then import and `app.use()` it in `src/index.ts`.
- The `.md` files at the repo root (`clients.md`, `create-atendimento-reposicao.md`, etc.) and
  in `docs/` are API/behavior specs for the SeuFisio endpoints — consult them when
  implementing a route.
- To document a new upstream flow: record it in the browser and convert the HAR with
  `npm run har`. Steps in `docs/como-capturar-requests.md`. HAR files carry a live token,
  so `capturas/` and `*.har` are gitignored.
