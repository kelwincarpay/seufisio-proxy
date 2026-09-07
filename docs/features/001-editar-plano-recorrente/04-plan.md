# 001-editar-plano-recorrente · Plan

Cap 20k chars. Shape, not code. Every item traces to an FR or a decision.

## Approach
A edição entra pela rota `PUT /api/plans/recurring/:planId` em `src/routes/plans.ts` (AD-04), ao lado do
`GET /recurring/:planId` já existente, cuja resposta passa a ser lida direto do `cliente-servico` e
normalizada conforme ADR-0001 (FR-01, D-07). Toda a lógica pura vai para `src/services/recurring-plans.ts`,
que já concentra builder, preço, leitura e `getTipoAtendimento`: um merge GET→PUT que ecoa o objeto lido e
aplica só os campos informados (AD-01, FR-05/07/08), o parser do limite semanal (D-06), a regra de preço da
edição sobre `resolvePrice()` (D-03) e o mapeador bruto→normalizado. Profissional e sala continuam saindo de
`assignProfessionals()`, com âncora em hoje passando `studioToday()` no parâmetro `inicioServico` já
existente (AD-02, FR-12/13/15). O repasse de status 4xx (D-08) fica num helper local da rota, sem tocar
outros routers (ADR-0002). Sem Supabase (AD-05), sem WhatsApp (D-05), sem dependência nova (AD-06).

Consequência aprovada: o `GET /recurring/:planId` atual (exige `?cliente_id=`, devolve campos da lista de
vendas) é substituído; `atendimentos_feitos`, `atendimentos_repor`, `validade` e `pausado_em` deixam de
existir na rota e o MD da skill (FR-26) documenta a troca.

## Models and data

| Entity | Action | Fields (type, nullability) | Migration |
| --- | --- | --- | --- |
| `cliente-servico` (upstream, SeuFisio) | read + write | Objeto de ~50 chaves lido por `GET /api/cliente-servico/:id`. Relevantes: `id:number`, `cliente_id:number`, `tipo_atendimento_id:number`, `periodicidade:number`, `inicio_servico:"YYYY-MM-DD"`, `data_encerramento:"YYYY-MM-DD"\|null`, `dia_padrao_cobranca:number\|string`, `dia_padrao_renovacao:number\|string`, `valor_congelado:number\|null`, `congelar_valor:boolean`, `percentual_desconto:string\|number`, `nome:string`, `nome_exibicao_tipo_atendimento:string`, por dia (`domingo…sabado`): `<dia>:boolean`, `hora_<dia>:string` (`""` sem uso), `profissional_id_<dia>:number\|null`, `sala_id_<dia>:number\|null`. Não há objeto `tipo_atendimento` aninhado. | no |
| `tipo-atendimento` (upstream) | read | `id:number`, `nome:string`, `valor_mensal…valor_anual:number\|null`, `ativo:boolean` — via `getTipoAtendimento(id)` existente (lista `?rowsPerPage=all` + find). | no |
| `RecurringPlanEditInput` (tipo TS, novo) | new | `dia_vencimento?: number` (1–31) · `dias?: DayRequest[]` (`dia: DayName`, `hora: "HH:mm"`, `profissional_id?: number\|null`) · `tipo_atendimento_id?: number` · `valor_mensal?: number` · `percentual_desconto?: number` (0–100). Todos opcionais; corpo vazio é 400. [FR-05/06/07/12/13/17/20] | no |
| `NormalizedRecurringPlan` (tipo TS, novo) | new | `id:number` · `cliente_id:number` · `servico:{id:number, nome:string}` · `dias:{dia:DayName, hora:string, profissional:{id:number\|null, nome:string\|null}, sala:number\|null, lotado:boolean\|null}[]` · `valor_mensal:number\|null` · `percentual_desconto:number` · `dia_vencimento:number` · `limite_semanal:number\|null` · `aviso?:string` (só quando `limite_semanal` é null, FR-04) · `horarios:string` · `raw?:Record<string,any>` (só `?raw=1`). `lotado` é `null` no GET e boolean no PUT. [ADR-0001, D-07, FR-01–04, FR-15/16/20] | no |
| Supabase | — | nenhuma tabela tocada [AD-05, FR-24] | no |

## Contracts

### `GET /api/plans/recurring/:planId[?raw=1]` (proxy → skill)
- **Sender shape (skill):** path `planId:number`; query `raw?: "1"`. Sem `cliente_id`.
- **Receiver shape (proxy, 200):** `NormalizedRecurringPlan` (acima), `raw` presente só com `raw=1` [FR-01, FR-02].
- **Erros:** upstream 4xx → mesmo status `{ error, details }`; 5xx/rede → `500 { error, details }` [FR-21/22].
- **File:** `src/routes/plans.ts` (rota) · `src/services/recurring-plans.ts` (`normalizeRecurringPlan`).
- **Audit spec:** `scripts/check-payloads.ts` — `normalizeRecurringPlan(GET do HAR)` contra objeto esperado escrito à mão.

### `PUT /api/plans/recurring/:planId[?raw=1]` (skill → proxy)
- **Sender shape (skill):** `RecurringPlanEditInput` em JSON.
- **Receiver shape (proxy, 200):** `NormalizedRecurringPlan` obtido por re-GET, com `dias[].lotado` boolean vindo da atribuição [FR-05, FR-15, FR-16].
- **Erros locais (400):** `{ error }` para tipo/formato inválido [FR-06/23]; `{ error, problemas: AssignmentProblem[] }` para dia/hora sem slot (padrão da criação, AD-03); `{ error, limite_semanal:number, dias_pedidos:number, servico:string }` para excesso do limite [FR-09].
- **Erros upstream:** como no GET [FR-21/22].
- **File:** `src/routes/plans.ts`.
- **Audit spec:** sem seam automatizado para rota (não há suíte); verificação manual contra `docs/plano-recorrente-api.md` [spec § Test seams].

### Upstream `PUT /api/cliente-servico/:id` (proxy → SeuFisio)
- **Sender shape (proxy):** objeto completo ecoado do GET com deltas: `data_encerramento` ISO→`"MM/YYYY"` (ou `""` quando null); `possui_data_encerramento:boolean` adicionado; `dia_padrao_cobranca:string`; `percentual_desconto:number`; campos de dia via `weekdayFields()`; `tipo_atendimento_id`, `nome_exibicao_tipo_atendimento`, `valor_congelado`, `congelar_valor` quando serviço/preço mudam. `dia_padrao_renovacao`, `inicio_servico`, `periodicidade` e o resto ecoados como lidos [AD-01, AD-07, FR-07, FR-08, FR-14].
- **Receiver shape (SeuFisio):** `200 { success: true }` (HAR, único caso capturado).
- **File:** `src/services/recurring-plans.ts` (`buildPlanEditPayload`, `updateRecurringPlan`).
- **Audit spec:** `scripts/check-payloads.ts` — diff chave a chave `buildPlanEditPayload(GET do HAR, {dia_vencimento:15})` vs PUT do HAR (esperado: 0 diferenças).

### Upstream `GET /api/tipo-atendimento` e `GET /api/slots/calendario`
- Existentes, sem alteração: `getTipoAtendimento(id)` e `assignProfessionals()` [FR-03, FR-11, FR-12].

## Services and flows

Todas em `src/services/recurring-plans.ts`, salvo indicação:

- `parseWeeklyLimit(nome: string): number | null` — regex `/(\d+)x\s*na\s*semana/i`, null sem match — FR-03, FR-04 [D-06]
- `weekdayFields(dias: PlanDay[]): Record<string, any>` — extraído de `buildPlanPayload()` (que passa a chamá-lo): 7 dias × flag/hora/profissional/sala, `""` e `null` nos sem uso — FR-14 [AD-07]
- `toMonthYear(iso: string | null): string` — `"YYYY-MM-DD"` → `"MM/YYYY"`, `""` para null — FR-08 [AD-07]
- `resolveEditPrice(raw, tipoNovo: any | null, valorMensal?: number): { valor_congelado: number | null; congelar_valor: boolean }` — `valorMensal` → congela; senão serviço trocado → `resolvePrice(tipoNovo, raw.periodicidade)`; senão ecoa `raw` — FR-17/18/19 [D-03]
- `buildPlanEditPayload(raw, input: RecurringPlanEditInput, dias: PlanDay[] | null, price, tipoNovo: any | null): Record<string, any>` — merge completo descrito no contrato upstream — FR-05/07/08/14/20 [AD-01]
- `normalizeRecurringPlan(raw, tipo, opts: { assigned?: AssignedDay[]; profissionais?: any[]; includeRaw?: boolean }): NormalizedRecurringPlan` — bruto → ADR-0001; `horarios` via `scheduleText()`; nomes de profissional por `profissionais` (GET) ou `assigned` (PUT) — FR-01/02/03/04/15/16/20 [D-07]
- `updateRecurringPlan(planId: number | string, payload: Record<string, any>): Promise<{ success: boolean }>` — `seufisioClient.put('/api/cliente-servico/:id')` — FR-05 [NFR-02]
- `countRequestedDays(dias: DayRequest[]): number` — dias distintos — FR-09
- Em `src/routes/plans.ts`: `validateEditInput(body): { ok: true; input: RecurringPlanEditInput } | { ok: false; error: string }` (estilo manual, AD-06) — FR-06; `upstreamErrorStatus(error): number` — 4xx repassado, senão 500 — FR-21/22 [D-08]

### Flow: GET plano recorrente
1. skill → proxy via HTTP `GET /api/plans/recurring/:planId?raw=1` — `secretTokenAuth` [NFR-01]
2. proxy → SeuFisio via HTTP `GET /api/cliente-servico/:id` (`getRecurringPlan`)
3. proxy → SeuFisio via HTTP `GET /api/tipo-atendimento?rowsPerPage=all` (`getTipoAtendimento(raw.tipo_atendimento_id)`) e `GET /api/profissional/todos-profissionais` (nomes), em paralelo
4. proxy → skill: `200 NormalizedRecurringPlan` (`lotado:null`, `aviso` se limite null)

### Flow: PUT plano recorrente
1. skill → proxy via HTTP `PUT /api/plans/recurring/:planId` — `RecurringPlanEditInput`
2. proxy: `validateEditInput` → 400 `{ error }` sem upstream [FR-06]
3. proxy → SeuFisio `GET /api/cliente-servico/:id` (estado atual) [FR-05]
4. proxy → SeuFisio `GET /api/tipo-atendimento` para `input.tipo_atendimento_id ?? raw.tipo_atendimento_id` [FR-11]
5. proxy: `parseWeeklyLimit(tipo.nome)`; se `dias` informado e limite não-null e `countRequestedDays > limite` → 400 `{ error, limite_semanal, dias_pedidos, servico }` [FR-09/10]
6. se `dias` informado: proxy → SeuFisio `GET /api/slots/calendario` via `assignProfessionals(dias, studioToday())`; `problemas.length > 0` → 400 `{ error, problemas }`; `profissional_id` informado prevalece [FR-12/13]
7. proxy: `resolveEditPrice` → `buildPlanEditPayload` [FR-07/08/14/17–20]
8. proxy → SeuFisio via HTTP `PUT /api/cliente-servico/:id` (`updateRecurringPlan`) [AD-01]
9. proxy → SeuFisio `GET /api/cliente-servico/:id` (re-GET) → `normalizeRecurringPlan(raw2, tipo, { assigned, includeRaw })` [FR-05/15/16]
10. proxy → skill: `200 NormalizedRecurringPlan`. Qualquer erro upstream nos passos 3–9 → `upstreamErrorStatus` + `{ error, details }` [FR-21/22]. Nenhuma escrita em Supabase nem WhatsApp [FR-24, D-05].

## UI
- n/a — feature só de API; o spec não aponta view e `layout_references` está vazio.

## Reuse

| What | Path | Used by |
| --- | --- | --- |
| `getRecurringPlan`, `getTipoAtendimento`, `resolvePrice`, `scheduleText`, `buildPlanPayload`, `DAY_NAMES`, `PlanDay` | `src/services/recurring-plans.ts` | novas funções de edição e normalizador |
| `assignProfessionals`, `DayRequest`, `AssignedDay`, `AssignmentProblem` | `src/services/slot-assignment.ts` | rota PUT (passo 6) |
| `studioToday` | `src/services/*` (importado em `plans.ts`) | âncora da atribuição |
| `seufisioClient.get/put` | `src/services/seufisio-client.ts` | `updateRecurringPlan` [NFR-02] |
| Validação manual `dia`/`hora` (`RECURRING_DAYS`, `/^\d{2}:\d{2}$/`) | `src/routes/plans.ts:100-111` | `validateEditInput` |
| Precedente de PUT completo GET→merge→PUT | `src/services/charges.ts:45-77` | `buildPlanEditPayload` |
| Precedente de status 400 vs 500 | `src/routes/charges.ts:143` | `upstreamErrorStatus` |
| Padrão de diff chave a chave contra captura | `scripts/check-payloads.ts:51-58` | novos checks |
| Conversão HAR → MD | `scripts/har-to-spec.ts`, `docs/como-capturar-requests.md:22-38` | `docs/editar-plano-recorrente.md` |
| Estrutura de doc de endpoint do proxy | `docs/api-specs.md` (Endpoint / Purpose / Request / Business Logic / Success / Error Responses) | `docs/plano-recorrente-api.md` |
| Skill doc existente da rota GET antiga | `ATUALIZACAO-SKILL-OPENCLAW.md` § 17 | referência do que muda para a skill |

## New dependencies

| Name | Why the stack cannot | Size | Licence | Confirmed |
| --- | --- | --- | --- | --- |
| none | — | — | — | — |

## File map

| File | Action | Layer | Why (FR) |
| --- | --- | --- | --- |
| `src/routes/plans.ts` | modify | api | GET reescrito, PUT novo, `validateEditInput`, `upstreamErrorStatus` — FR-01/02/05/06/09/21–23 |
| `src/services/recurring-plans.ts` | modify | service | `parseWeeklyLimit`, `weekdayFields`, `toMonthYear`, `resolveEditPrice`, `buildPlanEditPayload`, `normalizeRecurringPlan`, `updateRecurringPlan`, tipos — FR-03/04/07/08/10–20 (ADR-0001 manda o normalizador aqui) |
| `src/services/slot-assignment.ts` | — | service | reutilizado sem mudança — FR-12/13/15 |
| `scripts/check-payloads.ts` | modify | test | fixtures GET/PUT do HAR e checks abaixo — FR-25 |
| `docs/editar-plano-recorrente.md` | create | docs | saída de `npm run har`; nenhum doc existente cobre o PUT de `cliente-servico` — FR-25, NFR-04 |
| `docs/plano-recorrente-api.md` | create | docs | MD da skill em pt-BR. Considerados: `docs/api-specs.md` (inglês, rotas antigas, 909 linhas) e `ATUALIZACAO-SKILL-OPENCLAW.md` (fora de `docs/`, escopo geral) — FR-26, AD-09 |
| `.gitignore` | modify | infra | adicionar `reqs/`; hoje só `capturas/` e `*.har` — NFR-04 |

<!-- Every `create` needs a justification against Reuse. -->

## Test plan

Sem suíte no repo; todos os seams automatizados vivem em `scripts/check-payloads.ts` (execução manual, saída `DIFF …`/`✔`).

### Seam: builder do payload de edição
- **Spec file:** `scripts/check-payloads.ts`
- **Cases:**
  - `edit payload · vencimento 15` — `buildPlanEditPayload(GET_HAR, {dia_vencimento:15})` vs PUT_HAR: 0 diffs (cobre MM/YYYY, `possui_data_encerramento`, string em `dia_padrao_cobranca`, `percentual_desconto` numérico) — FR-07/08
  - `edit payload · corpo vazio` — só os 4 deltas de formato, nenhum valor de negócio alterado — FR-05
  - `edit payload · renovação preservada` — `dia_padrao_renovacao` e `data_encerramento` (mês) inalterados mesmo com `dia_vencimento` — FR-07 (proibido: sincronizar renovação)
  - `edit payload · dias` — `weekdayFields` escreve 7 dias, `""`/`null` nos sem uso; `buildPlanPayload` continua com 0 diffs contra o HAR de criação — FR-14

### Seam: regra de preço na edição
- **Spec file:** `scripts/check-payloads.ts`
- **Cases:**
  - `valor_mensal informado` → `valor_congelado` = informado, `congelar_valor:true` — FR-17
  - `serviço trocado sem valor` → `resolvePrice(tipoNovo, periodicidade)` — FR-18
  - `nada mudou` → ecoa `valor_congelado`/`congelar_valor` do GET — FR-19
  - `percentual_desconto` → gravado numérico e devolvido normalizado — FR-20

### Seam: limite semanal
- **Spec file:** `scripts/check-payloads.ts`
- **Cases:**
  - `"Pilates 1x na Semana"` → 1; `"Pilates 3x na Semana"` → 3; case-insensitive — FR-03
  - `"Aula Avulsa"`, `"Fisioterapia Sessão"` → null (vazio) — FR-04
  - `countRequestedDays` com dia repetido conta 1 — FR-09
  - decisão: 3 dias com limite 2 → bloqueia; limite null → não bloqueia — FR-09/10 (proibido: escrever acima do limite)

### Seam: normalizador
- **Spec file:** `scripts/check-payloads.ts`
- **Cases:**
  - `normalizeRecurringPlan(GET_HAR, tipo8)` → `dia_vencimento:2`, `limite_semanal:1`, `dias:[quinta 10:00]`, `horarios` de `scheduleText`, sem `raw` — FR-01/03/16
  - `includeRaw:true` → `raw` presente — FR-02
  - `aviso` presente só com limite null — FR-04

### Seam: fixture do fluxo upstream
- **Spec file:** `docs/editar-plano-recorrente.md` gerado por `npm run har -- reqs/editar-plano-cliente.har --out docs/editar-plano-recorrente.md` — FR-25, NFR-04

### Verificação manual da rota (sem seam)
- `PUT` 400 tipo/formato; 400 limite com `limite_semanal`/`dias_pedidos`; 400 `problemas` sem slot; `lotado:true/false` em turma cheia; upstream 404 repassado; `?raw=1` — conferido contra `docs/plano-recorrente-api.md` — FR-06/09/15/21/23

## Risks and rollout
- **Risk:** quebra do `GET /recurring/:planId` para a skill (perde `atendimentos_feitos`, `atendimentos_repor`, `validade`, `pausado_em`; deixa de aceitar `cliente_id`) — mitigation: aprovado explicitamente; `docs/plano-recorrente-api.md` traz seção "O que mudou" e a skill é atualizada junto (US-6).
- **Risk:** chave `congelar_valor` no PUT vs `congelar` em `ResolvedPrice` — mitigation: o check de 0 diffs contra o HAR falha se o nome estiver errado.
- **Risk:** PUT com troca de serviço/dias nunca capturado; SeuFisio pode recusar ou recomputar campos — mitigation: FR-21 repassa o 4xx; re-GET mostra o estado real; capturar novo HAR se houver recusa e anexar ao doc.
- **Risk:** `getTipoAtendimento` lista todos os serviços por chamada (2 chamadas no PUT) — mitigation: aceitável no volume do estúdio; uma chamada só quando o serviço não muda.
- **Risk:** âncora `studioToday()` pode escolher slot de hoje já passado no horário — mitigation: mesmo comportamento da criação com `inicio_servico` = hoje; documentado no MD.
- **Rollout:** deploy único do proxy; sem migração; sem feature flag. Ordem: proxy → atualizar skill com o novo MD. Rollback = revert do commit.
