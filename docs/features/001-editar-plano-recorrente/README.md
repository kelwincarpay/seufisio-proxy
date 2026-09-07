# 001-editar-plano-recorrente

**State:** execute · **Size:** M · **Track:** clarify → investigate → spec → plan → tickets → execute → review
**Branch:** feat/001-editar-plano-recorrente → main
**Next:** `/kss-review 001-editar-plano-recorrente`

> Index only. Cap 4k chars, one block per phase, at most 10 lines each.
> Detail lives in the phase files; anything longer goes to `notes/` and is linked.

## Brief
Symptom: a skill do OpenClaw não consegue editar um plano recorrente já vendido; o proxy não expõe os endpoints.
Outcome: via `/api`, o OpenClaw lê e edita qualquer campo editável do plano recorrente (vencimento, dias/horários com profissional pela grade/turma, preço, sessões/semana, serviço), é orientado antes de exceder o limite semanal, recebe erros no formato padrão, e um MD em `docs/` orienta a atualização da skill.
Actors/surfaces: atendente → skill SeuFisio no OpenClaw → proxy `/api` → SeuFisio
Layers: api (confirmar na investigação se algum estado local acompanha)
Out of scope: cancelar/encerrar plano; gerir atendimentos gerados; editar `pacote`; alterar a skill em si
Open facts: 8 — see 00-brief.md

## Investigation
Layers confirmed: api only (sem Supabase; sem layout). Write upstream = PUT objeto completo `/api/cliente-servico/:id`; HAR em `reqs/`, ainda não convertido.
Reuse: `assignProfessionals`, `buildPlanPayload`/`resolvePrice`, `getRecurringPlan`, padrão de erro `{error, details}`, `check-payloads.ts`.
Gap: nenhuma validação de limite semanal existe; limite só no texto `tipo_atendimento.nome` ("Nx na Semana").
Missing: corpo de erro do PUT (só caso feliz capturado); se PUT aceita troca de serviço/desconto.
Decisions: auto 9 (technical 9, layout 0) · open business 5 · open layout 0 · open technical 3.
Size: M (unchanged) — see 01-investigation.md, auto-decisions.md

## Decisions
Decided: D-01…D-08 (business 5 · layout 0 · technical 3)
Overrode: AD-03 → D-08
Deferred: none
Terms added: vencimento, limite semanal · ADRs: docs/adr/0001-contrato-plano-recorrente-normalizado.md, docs/adr/0002-repasse-status-4xx-upstream.md

## Spec
FRs: 26 · NFRs: 4 · stories: 6 · seams: 5 (0 new)
Blocked by DF-: none
Warnings: none
Errors: none
File: 03-spec.md (12.7k / 15k)

## Plan
Approach: PUT/GET em `plans.ts` sobre `cliente-servico` (GET → merge → PUT completo → re-GET), lógica pura em `recurring-plans.ts`, limite semanal por regex, 4xx repassado.
Entities: 4 (2 new, tipos TS) · Contracts: 3 · Surfaces: 0
Files: 2 create / 4 modify
New dependencies: none
Seams: 5 · specs planned: 4 blocos em check-payloads.ts + 1 doc HAR
Risk aceito: GET /recurring perde campos da lista de vendas (skill atualizada junto)
File: 04-plan.md (16.4k / 20k)

## Tickets
Mode: multi-agent · tickets: 5
Contract first: 01 · parallel after it: 02, 03, 04
Critical path: 01 → 02 → 05 — 58 turns
Total estimate: 103 turns
Not scheduled (DF-): none
Files: 05-tickets/ · graph.md

## Execution
Tickets integrated: 5/5 · turns 219/103 est. (05 rodou 87/10: 2 rejects, ambos doc-vs-código)
Critical path: 01 → 02 → 05 · merges f30dd9a → 461eeae → 570aecd → cab5033 → 50ce60c
Escalations: 03 sonnet-high → opus-medium (2 findings de validação); 05 sonnet-low → sonnet-medium → sonnet-high (doc)
Rebase conflict: 03 em `scripts/check-payloads.ts` (blocos 02/03), resolvido por sonnet-medium e revisado
Full suite: skipped to CI (`full_suite: ci`) · gates locais: tsc, build, check-payloads 43 ✔
Manual (.env real, plano 125): GET, 400s, 4xx repassado, limite, sem slot ✔ · PUT com sucesso: não verificado (sem plano de teste)
Deviation: branches de ticket sem prefixo `feat/` (colisão de ref com a feature branch)
PR: https://github.com/kelwincarpay/seufisio-proxy/pull/1 → main · **not merged**

## Review
—

## Docs
—

## Cost

> Rendered from `metrics.jsonl` by `scripts/render-cost.mjs`. Everything between the two markers is
> overwritten on every render — do not edit it by hand.

<!-- kss:cost:start -->

| Phase | Agents | Turns | Fresh in | Cache write | Cache read | Out | Cumulative | Wall | Files | +/− |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| clarify | 1 | 14 | 178 | 31.5k | 762.0k | 6.6k | 800.3k | 18m | 0 | +0/−0 |
| investigate | 12 | 94 | 2.1k | 523.0k | 5.81M | 82.8k | 6.42M | 7m | 0 | +0/−0 |
| grill | 4 | 70 | 1.3k | 140.6k | 4.17M | 30.5k | 4.34M | 22m | 0 | +0/−0 |
| spec | 2 | 14 | 358 | 80.9k | 819.7k | 11.3k | 912.2k | 10m | 0 | +0/−0 |
| plan | 12 | 105 | 2.1k | 657.9k | 7.35M | 104.7k | 8.12M | 14m | 0 | +0/−0 |
| tickets | 4 | 47 | 1.3k | 247.0k | 3.37M | 66.3k | 3.68M | 49m | 0 | +0/−0 |
| execute | 98 | 3958 | 94.0k | 9.99M | 412.42M | 3.85M | 426.35M | 45m | 13 | +3887/−91 |
| 　└ ticket 01 | 11 | 115 | 2.9k | 420.0k | 6.81M | 81.9k | 7.31M | 8m | 3 | +151/−0 |
| 　└ ticket 02 | 34 | 868 | 21.8k | 2.87M | 67.32M | 984.7k | 71.20M | 19m | 2 | +272/−23 |
| 　└ ticket 03 | 22 | 996 | 23.3k | 2.42M | 101.57M | 939.8k | 104.95M | 26m | 2 | +280/−48 |
| 　└ ticket 04 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | — | 3 | +3130/−0 |
| 　└ ticket 05 | 30 | 1979 | 45.9k | 4.27M | 236.73M | 1.84M | 242.89M | 45m | 3 | +54/−20 |
| **Total** | 133 | 4302 | 101.3k | 11.67M | 434.70M | 4.15M | 450.62M | 2h45 | 13 | +3887/−91 |

<!-- kss:cost:end -->
