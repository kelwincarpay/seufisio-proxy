# 02 · Service — builder de edição, preço, limite semanal e normalizador

**Layer:** service · **Blocked by:** 01 · **Blocks:** 05 ·
**Model:** opus · **Effort:** high · **Helpers:** runner ·
**Est.:** 40 turns · **Worktree:** yes

## Goal
Substituir os stubs do ticket 01 em `src/services/recurring-plans.ts` pela lógica pura da edição: o merge
GET→PUT que ecoa o `cliente-servico` lido e aplica só os campos informados (`buildPlanEditPayload`), os
conversores de formato (`toMonthYear`, `weekdayFields` extraído de `buildPlanPayload`), a regra de preço
da edição (`resolveEditPrice` sobre `resolvePrice`), o parser do limite semanal (`parseWeeklyLimit`,
`countRequestedDays`), a chamada upstream `updateRecurringPlan` e o mapeador bruto→normalizado
(`normalizeRecurringPlan`). Cada função é conferida em `scripts/check-payloads.ts` contra o GET e o PUT do
HAR `reqs/editar-plano-cliente.har` (0 diffs chave a chave). Nenhuma rota é tocada aqui.

## Requirements covered
- **FR-03** · Given um serviço cujo `tipo_atendimento.nome` casa com `/(\d+)x\s*na\s*semana/i`, when o plano é lido ou editado, then `limite_semanal` traz o inteiro capturado. [D-06]
- **FR-04** · Given um serviço cujo nome não casa com a regex, when o plano é lido ou editado, then `limite_semanal` é `null` e a resposta traz um aviso textual de que o limite não pôde ser determinado. [D-06]
- **FR-05** (merge e PUT upstream) · Given um plano recorrente existente, when a skill chama `PUT /api/plans/recurring/:planId`, then o proxy faz GET do `cliente-servico`, aplica só os campos informados sobre o objeto lido, envia PUT de objeto completo em `/api/cliente-servico/:id` e responde com o estado obtido por um novo GET. [AD-01, AD-04]
- **FR-07** · Given `dia_vencimento` informado, when a edição é aplicada, then o proxy grava o valor em `dia_padrao_cobranca` e preserva `dia_padrao_renovacao` e `data_encerramento` conforme lidos, sem expor esses dois campos como editáveis. [D-02, AD-07]
- **FR-08** · Given o objeto lido, when o payload de PUT é montado, then campos fixos e formatos de data seguem o builder da criação (`data_encerramento` em MM/YYYY na escrita, `dia_padrao_*` como dia do mês, `possui_data_encerramento` coerente). [AD-07, AD-01]
- **FR-09** (contagem) · Given dias/horários informados e `limite_semanal` determinado, when a contagem de dias pedidos excede o limite, then o proxy responde 400 informando o limite do serviço atual e a quantidade pedida, sem opção de confirmação e sem chamar o PUT. [D-01, D-06]
- **FR-14** · Given dias/horários informados, when a grade semanal é gravada, then os sete dias são escritos com a mesma semântica da criação: flag do dia, hora, profissional e sala, com string vazia e ids nulos nos dias sem uso. [AD-07, AD-01]
- **FR-16** (campo `horarios`) · Given a edição concluída, when a resposta é montada, then ela inclui `horarios` com o texto de agenda gerado pela mesma função da criação, e nenhuma mensagem WhatsApp é enviada pelo proxy. [D-05]
- **FR-17** · Given `valor_mensal` informado, when a edição é aplicada, then ele passa a ser o novo `valor_congelado`, independentemente de troca de serviço. [D-03]
- **FR-18** · Given `valor_mensal` ausente e `tipo_atendimento_id` alterado, when a edição é aplicada, then o valor é recalculado pela regra de preço da criação para o novo serviço e periodicidade. [D-03]
- **FR-19** · Given `valor_mensal` ausente e serviço inalterado, when a edição é aplicada, then o `valor_congelado` lido é mantido. [D-03]
- **FR-20** · Given `percentual_desconto` informado, when a edição é aplicada, then o valor é gravado no plano e devolvido na resposta normalizada. [D-03, D-07]
- **FR-25** (parte dos checks) · Given o HAR `reqs/editar-plano-cliente.har`, when a feature é entregue, then ele está convertido em `docs/editar-plano-recorrente.md` e o builder do payload de edição está conferido contra o HAR em `scripts/check-payloads.ts`. [AD-08]

## Plan excerpt

| File | Action | Layer | Why (FR) |
| --- | --- | --- | --- |
| `src/services/recurring-plans.ts` | modify | service | `parseWeeklyLimit`, `weekdayFields`, `toMonthYear`, `resolveEditPrice`, `buildPlanEditPayload`, `normalizeRecurringPlan`, `updateRecurringPlan`, `countRequestedDays` — FR-03/04/07/08/14–20 |
| `scripts/check-payloads.ts` | modify | test | fixtures GET/PUT do HAR e os checks abaixo — FR-25 |

**Contract shapes:**
```
Upstream PUT /api/cliente-servico/:id (proxy → SeuFisio) — objeto completo ecoado do GET com deltas:
  data_encerramento: ISO "YYYY-MM-DD" → "MM/YYYY" ("" quando null)
  possui_data_encerramento: boolean (adicionado; true quando data_encerramento não-null)
  dia_padrao_cobranca: string (dia do mês)          ← input.dia_vencimento quando informado
  percentual_desconto: number                        ← input.percentual_desconto quando informado
  campos de dia via weekdayFields(): 7 dias × <dia>:boolean, hora_<dia>:string ("" sem uso),
      profissional_id_<dia>:number|null, sala_id_<dia>:number|null   ← só quando `dias` informado
  tipo_atendimento_id, nome_exibicao_tipo_atendimento, valor_congelado, congelar_valor ← quando serviço/preço mudam
  dia_padrao_renovacao, inicio_servico, periodicidade e o resto: ecoados como lidos
  Resposta upstream: 200 { success: true }

resolveEditPrice(raw, tipoNovo, valorMensal?):
  valorMensal informado → { valor_congelado: valorMensal, congelar_valor: true }
  senão tipoNovo não-null (serviço trocado) → resolvePrice(tipoNovo, raw.periodicidade) mapeado
      (ResolvedPrice.congelar → congelar_valor; ResolvedPrice.valor_congelado → valor_congelado)
  senão → { valor_congelado: raw.valor_congelado, congelar_valor: raw.congelar_valor }

parseWeeklyLimit(nome): regex /(\d+)x\s*na\s*semana/i → inteiro; null sem match
countRequestedDays(dias): número de `dia` distintos

normalizeRecurringPlan(raw, tipo, { assigned?, profissionais?, includeRaw? }) → NormalizedRecurringPlan (ticket 01):
  servico: { id: raw.tipo_atendimento_id, nome: tipo?.nome ?? raw.nome_exibicao_tipo_atendimento }
  dias: para cada DAY_NAMES com raw[<dia>] === true → { dia, hora: raw.hora_<dia>,
        profissional: { id: raw.profissional_id_<dia>, nome: via `profissionais` (GET) ou `assigned` (PUT) ou null },
        sala: raw.sala_id_<dia>, lotado: assigned ? <do AssignedDay> : null }
  valor_mensal: raw.valor_congelado · percentual_desconto: Number(raw.percentual_desconto) || 0
  dia_vencimento: Number(raw.dia_padrao_cobranca) · limite_semanal: parseWeeklyLimit(servico.nome)
  aviso: só quando limite_semanal === null ("Limite semanal não pôde ser determinado pelo nome do serviço …")
  horarios: scheduleText(<dias como PlanDay>) · raw: só com includeRaw
```

**Reuse:**
- `resolvePrice` (retorna `ResolvedPrice { congelar, valor_congelado, valor_mensal }`) — `src/services/recurring-plans.ts:99-105, 122-136`
- `buildPlanPayload` (fonte dos 7 campos de dia a extrair para `weekdayFields`; passa a chamá-lo) — `src/services/recurring-plans.ts:205-256`
- `scheduleText` — `src/services/recurring-plans.ts:149-158`
- `getRecurringPlan`, `getTipoAtendimento` — `src/services/recurring-plans.ts:274-287`
- `seufisioClient.put` — `src/services/seufisio-client.ts:46, 60`
- Precedente GET→merge→PUT completo (`applyDiscount`) — `src/services/charges.ts:44-77`
- Diff chave a chave contra captura — `scripts/check-payloads.ts:47-58`
- `AssignedDay` (campos de profissional/sala/lotação) — `src/services/slot-assignment.ts:14-27`

## Files
- **Write:** `src/services/recurring-plans.ts` — substituir os stubs (final do arquivo, após linha ~340 do original); refatorar `buildPlanPayload` (205-256) para chamar `weekdayFields` sem mudar sua saída.
- **Write:** `scripts/check-payloads.ts` — anexar ao final um bloco `// --- 001 · service: edição de plano recorrente ---` com as fixtures `GET_HAR` (objeto `cliente-servico` da resposta do GET no HAR) e `PUT_HAR` (corpo do PUT no HAR), extraídas de `reqs/editar-plano-cliente.har` com `jq`/`node` (não abra o HAR inteiro no contexto; filtre pelas entries de `/api/cliente-servico/`).
- **Read for pattern:** `src/services/recurring-plans.ts` — lines 9-22, 60-65, 99-136, 149-158, 205-256, 274-287.
- **Read for pattern:** `scripts/check-payloads.ts` — lines 1-16 e 40-60.
- **Read for pattern:** `src/services/charges.ts` — lines 44-77.
- **Read for pattern:** `src/services/slot-assignment.ts` — lines 14-27.

## Tests
- **Spec file:** `scripts/check-payloads.ts` (saída `DIFF …` / `✔ …`; o script deve sair com código ≠ 0 se houver DIFF)
- **Cases:**
  - `edit payload · vencimento 15` — `buildPlanEditPayload(GET_HAR, {dia_vencimento:15}, null, resolveEditPrice(GET_HAR,null), null)` vs `PUT_HAR`: 0 diffs (cobre MM/YYYY, `possui_data_encerramento`, string em `dia_padrao_cobranca`, `percentual_desconto` numérico) — FR-07/08
  - `edit payload · corpo vazio` — só os deltas de formato; nenhum valor de negócio alterado — FR-05
  - `edit payload · renovação preservada` — `dia_padrao_renovacao` e `data_encerramento` (mês) inalterados mesmo com `dia_vencimento` — FR-07 (proibido: sincronizar renovação)
  - `edit payload · dias` — `weekdayFields` escreve 7 dias, `""`/`null` nos sem uso; `buildPlanPayload` continua com 0 diffs contra o check de criação já existente — FR-14
  - `valor_mensal informado` → `valor_congelado` = informado, `congelar_valor:true` — FR-17
  - `serviço trocado sem valor` → igual a `resolvePrice(tipoNovo, periodicidade)` — FR-18
  - `nada mudou` → ecoa `valor_congelado`/`congelar_valor` do GET — FR-19
  - `percentual_desconto` → gravado numérico no payload e devolvido em `normalizeRecurringPlan` — FR-20
  - `"Pilates 1x na Semana"` → 1; `"Pilates 3x na Semana"` → 3; `"PILATES 2X NA SEMANA"` → 2 — FR-03
  - `"Aula Avulsa"`, `"Fisioterapia Sessão"` → null (caso vazio) — FR-04
  - `countRequestedDays` com dia repetido conta 1 — FR-09
  - `normalizeRecurringPlan(GET_HAR, {id:8, nome:'Pilates 1x na Semana'})` → `dia_vencimento:2`, `limite_semanal:1`, `dias:[quinta 10:00]`, `horarios` igual a `scheduleText`, sem `raw`, sem `aviso` — FR-01/03/16
  - `includeRaw:true` → `raw` presente — FR-02
  - `aviso` presente só com limite null — FR-04
- **Command:** `SEUFISIO_USER=x SEUFISIO_PASSWORD=x SEUFISIO_CLIENT_SECRET=x API_SECRET_TOKEN=x npx tsx scripts/check-payloads.ts`
- A **red run is required before implementation**: com os stubs do ticket 01, o bloco deve falhar com `Error: not implemented`. Paste the failing output in the report.

## Project rules that apply
- CLAUDE.md · "New upstream calls should go through `services/seufisio-client.ts`" — `updateRecurringPlan` usa `seufisioClient.put`.
- CLAUDE.md · "Import the `env` object; do not read `process.env` directly elsewhere".
- CLAUDE.md · `scripts/check-payloads.ts` confere as funções puras contra os dados das capturas — mantenha o padrão `DIFF`/`✔`.
- CLAUDE.md · "HAR files carry a live token, so `capturas/` and `*.har` are gitignored" — nunca copie tokens/headers do HAR para o script; só os corpos.

## Do not
- Open `03-spec.md` or `04-plan.md` — everything you need is in this ticket.
- Read whole files over 300 lines; use ranges. Nunca `cat` o HAR: filtre com `jq`.
- Tocar em `src/routes/*` (ticket 03) ou em docs (ticket 04).
- Sincronizar `dia_padrao_renovacao` com `dia_vencimento`, ou alterar `inicio_servico`/`periodicidade`.
- Run the full test suite mid-ticket (não há suíte; rode só o comando acima).

## Report back (≤1.5k chars, this exact shape)
```
Ticket: 02-service-edicao-e-normalizador · <state: done | blocked>
Branch: <branch> (worktree <path>)
Commits: <sha> test: … / <sha> feat: …
Files: <path>, <path>
Tests: <command> → <result>
Red run: <the failing assertion / first failure line>
Deviations: <none, or one line each with why>
Blocked on: <only when state is blocked>
```
