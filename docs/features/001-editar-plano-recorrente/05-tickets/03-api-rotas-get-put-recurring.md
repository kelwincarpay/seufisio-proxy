# 03 · API — `GET`/`PUT /api/plans/recurring/:planId`

**Layer:** api · **Blocked by:** 01 · **Blocks:** 05 ·
**Model:** sonnet · **Effort:** high · **Helpers:** explorer ·
**Est.:** 30 turns · **Worktree:** yes

## Goal
Em `src/routes/plans.ts`, reescrever o `GET /recurring/:planId` (sem `cliente_id`, resposta normalizada) e
criar o `PUT /recurring/:planId` seguindo o fluxo abaixo, com `validateEditInput` (validação manual, 400
sem upstream) e `upstreamErrorStatus` (4xx repassado, resto 500). A rota codifica **contra as assinaturas
do ticket 01**, que ainda são stubs: o executor não implementa lógica de serviço; o fio real vem no ticket
05. Os dois helpers são exportados e conferidos em `scripts/check-payloads.ts`.

## Requirements covered
- **FR-01** · Given um plano recorrente existente, when a skill chama `GET /api/plans/recurring/:planId`, then o proxy lê o `cliente-servico` upstream por id e responde 200 com o plano normalizado espelhando o 201 do POST /api/plans, mais `percentual_desconto`, `dia_vencimento`, `limite_semanal` e `horarios`. [D-07, AD-04, AD-01]
- **FR-02** · Given a leitura ou a edição, when a query traz `raw=1`, then a resposta inclui `raw` com o objeto `cliente-servico` bruto do SeuFisio; sem `raw=1`, o campo é omitido. [D-07]
- **FR-05** · Given um plano recorrente existente, when a skill chama `PUT /api/plans/recurring/:planId`, then o proxy faz GET do `cliente-servico`, aplica só os campos informados sobre o objeto lido, envia PUT de objeto completo em `/api/cliente-servico/:id` e responde com o estado obtido por um novo GET. [AD-01, AD-04]
- **FR-06** · Given o corpo da edição, when os campos informados falham em tipo ou formato (dia do mês fora de 1–31, hora inválida, dia da semana desconhecido, `tipo_atendimento_id` não numérico), then o proxy responde 400 `{ error }` sem chamar o upstream. [AD-06, D-08]
- **FR-09** · Given dias/horários informados e `limite_semanal` determinado, when a contagem de dias pedidos excede o limite, then o proxy responde 400 informando o limite do serviço atual e a quantidade pedida, sem opção de confirmação e sem chamar o PUT. [D-01, D-06]
- **FR-10** · Given dias/horários informados e `limite_semanal` igual a `null`, when a edição é aplicada, then o proxy não valida o limite e prossegue com a escrita. [D-06]
- **FR-11** · Given a edição troca `tipo_atendimento_id`, when o limite semanal é avaliado, then o limite usado é o do novo serviço, não o do serviço anterior. [D-01, D-06]
- **FR-12** · Given dias/horários informados sem `profissional_id`, when a edição é aplicada, then o proxy resolve profissional e sala de cada dia/hora pela grade e turma com âncora na data efetiva da edição, e grava `profissional_id_{dia}` e `sala_id_{dia}`. [AD-02]
- **FR-13** · Given um dia/horário informado com `profissional_id`, when a edição é aplicada, then o valor informado prevalece sobre a resolução pela grade. [AD-02]
- **FR-15** · Given um dia/horário cujo slot está lotado, when a edição é aplicada, then a edição prossegue e o dia correspondente na resposta traz `lotado: true`; dias com vaga trazem `lotado: false`. [D-04]
- **FR-16** · Given a edição concluída, when a resposta é montada, then ela inclui `horarios` com o texto de agenda gerado pela mesma função da criação, e nenhuma mensagem WhatsApp é enviada pelo proxy. [D-05]
- **FR-21** · Given o SeuFisio responde 4xx a qualquer chamada da edição ou leitura, when o proxy monta a resposta, then ele repassa o mesmo status HTTP com corpo `{ error, details }`, onde `details` é o corpo upstream ou a mensagem. [D-08]
- **FR-22** · Given o SeuFisio responde 5xx ou a chamada falha por rede, when o proxy monta a resposta, then ele responde 500 com corpo `{ error, details }`. [D-08]
- **FR-23** · Given uma falha de validação local, when o proxy responde, then o status é 400 e o corpo mantém a chave `error`. [D-08, AD-06]
- **FR-24** · Given uma edição concluída, when o proxy termina o fluxo, then nenhuma escrita é feita no Supabase. [AD-05]

## Plan excerpt

| File | Action | Layer | Why (FR) |
| --- | --- | --- | --- |
| `src/routes/plans.ts` | modify | api | GET reescrito, PUT novo, `validateEditInput`, `upstreamErrorStatus` — FR-01/02/05/06/09/21–23 |
| `scripts/check-payloads.ts` | modify | test | checks de `validateEditInput` e `upstreamErrorStatus` |

**Contract shapes:**
```
GET /api/plans/recurring/:planId[?raw=1]
  200 → NormalizedRecurringPlan (ticket 01), `raw` só com raw=1, `dias[].lotado: null`
  upstream 4xx → mesmo status { error, details } · 5xx/rede → 500 { error, details }

PUT /api/plans/recurring/:planId[?raw=1]   body: RecurringPlanEditInput (ticket 01)
  200 → NormalizedRecurringPlan por re-GET, `dias[].lotado` boolean vindo da atribuição
  400 { error }                                              tipo/formato inválido, corpo vazio
  400 { error, problemas: AssignmentProblem[] }              dia/hora sem slot (padrão da criação)
  400 { error, limite_semanal: number, dias_pedidos: number, servico: string }   excesso do limite
  upstream 4xx/5xx → como no GET

validateEditInput(body): { ok: true; input: RecurringPlanEditInput } | { ok: false; error: string }
  dia_vencimento inteiro 1–31 · dias[]: dia ∈ RECURRING_DAYS, hora /^\d{2}:\d{2}$/, profissional_id number|null|ausente
  tipo_atendimento_id number · valor_mensal number ≥ 0 · percentual_desconto number 0–100 · corpo sem nenhum campo → ok:false
upstreamErrorStatus(error): number   // axios error com response.status 400–499 → esse status; senão 500

Flow GET: secretTokenAuth → getRecurringPlan(id) → em paralelo getTipoAtendimento(raw.tipo_atendimento_id) e
  GET /api/profissional/todos-profissionais (nomes) → normalizeRecurringPlan(raw, tipo, { profissionais, includeRaw })
Flow PUT:
  1 validateEditInput → 400 { error } sem upstream
  2 raw = getRecurringPlan(id)
  3 tipo = getTipoAtendimento(input.tipo_atendimento_id ?? raw.tipo_atendimento_id); tipoNovo = trocou ? tipo : null
  4 limite = parseWeeklyLimit(tipo.nome); se dias && limite !== null && countRequestedDays(dias) > limite
      → 400 { error, limite_semanal, dias_pedidos, servico: tipo.nome }
  5 se dias: assigned = await assignProfessionals(dias, studioToday()); problemas.length>0 → 400 { error, problemas };
      profissional_id informado prevalece; monta PlanDay[] (dia, hora, profissional_id, sala_id)
  6 price = resolveEditPrice(raw, tipoNovo, input.valor_mensal); payload = buildPlanEditPayload(raw, input, planDays|null, price, tipoNovo)
  7 await updateRecurringPlan(id, payload)
  8 raw2 = getRecurringPlan(id) → 200 normalizeRecurringPlan(raw2, tipo, { assigned, includeRaw })
  erro upstream em 2–8 → res.status(upstreamErrorStatus(e)).json({ error, details: e.response?.data ?? e.message })
  Nenhuma escrita em Supabase, nenhum envio WhatsApp.
```

**Reuse:**
- Validação manual `dia`/`hora` (`RECURRING_DAYS`, `/^\d{2}:\d{2}$/`) — `src/routes/plans.ts:99-110`
- Handler POST que chama `assignProfessionals` e trata `problemas` — `src/routes/plans.ts:60-213` (chamada na 136)
- `studioToday` — importado em `plans.ts:6` de `../services/client-attendances`
- `assignProfessionals`, `DayRequest`, `AssignedDay`, `AssignmentProblem` — `src/services/slot-assignment.ts:14-34, 67-72, 87-`
- Precedente de status 400 vs 500 — `src/routes/charges.ts:138-145`
- Stubs/tipos do ticket 01 — `src/services/recurring-plans.ts` (final do arquivo)

## Files
- **Write:** `src/routes/plans.ts` — substituir o handler `GET /recurring/:planId` (linhas 299-346); adicionar `PUT /recurring/:planId` logo após; helpers exportados `validateEditInput` e `upstreamErrorStatus` perto da validação existente (99-110). Ajustar imports (1-19).
- **Write:** `scripts/check-payloads.ts` — anexar ao final um bloco `// --- 001 · api: validateEditInput / upstreamErrorStatus ---` importando de `../src/routes/plans`.
- **Read for pattern:** `src/routes/plans.ts` — lines 1-19, 60-213, 299-346.
- **Read for pattern:** `src/routes/charges.ts` — lines 138-145.
- **Read for pattern:** `src/services/slot-assignment.ts` — lines 14-34, 67-72, 87-110.
- **Read for pattern:** `scripts/check-payloads.ts` — lines 1-16.

## Tests
- **Spec file:** `scripts/check-payloads.ts`
- **Cases:**
  - `validateEditInput · corpo vazio` → `ok:false` — FR-06
  - `validateEditInput · dia_vencimento 0 / 32 / "15"` → `ok:false`; `15` → `ok:true` — FR-06
  - `validateEditInput · hora "9:00"` e `dia "quinta-feira"` → `ok:false`; `{dia:'quinta',hora:'09:00'}` → `ok:true` — FR-06
  - `validateEditInput · tipo_atendimento_id "8"` → `ok:false`; `percentual_desconto 101` → `ok:false` — FR-06
  - `validateEditInput · campos desconhecidos` são ignorados (não constam em `input`) — FR-05
  - `upstreamErrorStatus · response.status 404` → 404; `422` → 422; `500` → 500; erro sem response (rede) → 500 — FR-21/22
- **Command:** `SEUFISIO_USER=x SEUFISIO_PASSWORD=x SEUFISIO_CLIENT_SECRET=x API_SECRET_TOKEN=x npx tsx scripts/check-payloads.ts` e `npx tsc --noEmit -p .`
- A **red run is required before implementation**: o bloco deve falhar com `has no exported member 'validateEditInput'` (tsc) ou `is not a function` (tsx). Paste the failing output in the report.
- Verificação da rota em execução fica para o ticket 05 (os serviços ainda são stubs aqui).

## Project rules that apply
- CLAUDE.md · "All business/proxy endpoints live under `/api` and require the secret token" — a rota herda `secretTokenAuth` do mount em `/api/plans`; não adicionar auth própria.
- CLAUDE.md · "New upstream calls should go through `services/seufisio-client.ts`" — a lista de profissionais no GET usa `seufisioClient.get`.
- CLAUDE.md · "Import the `env` object; do not read `process.env` directly elsewhere".
- CLAUDE.md · Supabase/Evolution são opcionais e não participam desta rota (FR-24).

## Do not
- Open `03-spec.md` or `04-plan.md` — everything you need is in this ticket.
- Read whole files over 300 lines; use ranges (`plans.ts` tem 525 linhas).
- Implementar lógica dentro dos stubs de `recurring-plans.ts` (ticket 02) ou contornar os stubs com lógica na rota.
- Manter o `?cliente_id=` ou os campos `atendimentos_feitos`, `atendimentos_repor`, `validade`, `pausado_em` no GET.
- Oferecer "confirmar mesmo assim" no excesso de limite.
- Run the full test suite mid-ticket (não há suíte; rode só o comando acima).

## Report back (≤1.5k chars, this exact shape)
```
Ticket: 03-api-rotas-get-put-recurring · <state: done | blocked>
Branch: <branch> (worktree <path>)
Commits: <sha> test: … / <sha> feat: …
Files: <path>, <path>
Tests: <command> → <result>
Red run: <the failing assertion / first failure line>
Deviations: <none, or one line each with why>
Blocked on: <only when state is blocked>
```
