# 001-editar-plano-recorrente · Ticket graph

**Mode:** multi-agent

## Multi-agent

| # | Ticket | Layer | Blocked by | Model | Effort | Est. turns | Worktree |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | Contract — tipos e assinaturas do plano recorrente | contract | — | opus | high | 8 | yes |
| 02 | Service — builder de edição, preço, limite semanal e normalizador | service | 01 | opus | high | 40 | yes |
| 03 | API — `GET`/`PUT /api/plans/recurring/:planId` | api | 01 | sonnet | high | 30 | yes |
| 04 | Docs — HAR convertido, `.gitignore` e MD da skill | docs | 01 | sonnet | medium | 15 | yes |
| 05 | Integration — fio ponta a ponta e verificação da rota | integration | 02, 03, 04 | sonnet | low | 10 | yes |

- **Critical path:** 01 → 02 → 05 — 58 turns
- **Parallel after contract:** 02, 03, 04
- **Total estimate:** 103 turns

## Not scheduled (blocked by DF-)
- none — o spec não tem FR bloqueado por `DF-`.
