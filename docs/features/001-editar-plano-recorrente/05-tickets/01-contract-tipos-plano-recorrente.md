# 01 · Contract — tipos e assinaturas do plano recorrente

**Layer:** contract · **Blocked by:** — · **Blocks:** 02, 03, 04, 05 ·
**Model:** opus · **Effort:** high · **Helpers:** none ·
**Est.:** 8 turns · **Worktree:** yes

## Goal
Fixar em `src/services/recurring-plans.ts` o contrato que os demais tickets codificam contra: os tipos
`RecurringPlanEditInput` (entrada do PUT), `NormalizedPlanDay` e `NormalizedRecurringPlan` (resposta do
GET/PUT, ADR-0001) e as **assinaturas exportadas** das funções de edição/normalização como stubs que lançam
`Error('not implemented')`. Nenhuma lógica: só shapes, para que serviço, rota e docs avancem em paralelo. A
auditoria do contrato é um bloco de tipagem em `scripts/check-payloads.ts` com o objeto normalizado esperado
do HAR escrito à mão, que só compila quando os tipos existem.

## Requirements covered
- **FR-01** · Given um plano recorrente existente, when a skill chama `GET /api/plans/recurring/:planId`, then o proxy lê o `cliente-servico` upstream por id e responde 200 com o plano normalizado espelhando o 201 do POST /api/plans, mais `percentual_desconto`, `dia_vencimento`, `limite_semanal` e `horarios`. [D-07, AD-04, AD-01]
- **FR-02** · Given a leitura ou a edição, when a query traz `raw=1`, then a resposta inclui `raw` com o objeto `cliente-servico` bruto do SeuFisio; sem `raw=1`, o campo é omitido. [D-07]
- **FR-05** (shape de entrada) · Given um plano recorrente existente, when a skill chama `PUT /api/plans/recurring/:planId`, then o proxy faz GET do `cliente-servico`, aplica só os campos informados sobre o objeto lido, envia PUT de objeto completo em `/api/cliente-servico/:id` e responde com o estado obtido por um novo GET. [AD-01, AD-04]
- **FR-15** (campo `lotado`) · Given um dia/horário cujo slot está lotado, when a edição é aplicada, then a edição prossegue e o dia correspondente na resposta traz `lotado: true`; dias com vaga trazem `lotado: false`. [D-04]

## Plan excerpt

| File | Action | Layer | Why (FR) |
| --- | --- | --- | --- |
| `src/services/recurring-plans.ts` | modify | service | tipos `RecurringPlanEditInput`, `NormalizedRecurringPlan` e assinaturas — FR-01/02/05/15 |
| `scripts/check-payloads.ts` | modify | test | bloco de tipagem do objeto normalizado esperado — FR-25 |

**Contract shapes:**
```
RecurringPlanEditInput (novo):
  dia_vencimento?: number            // 1–31
  dias?: DayRequest[]                // DayRequest de slot-assignment: { dia: DayName, hora: "HH:mm", profissional_id?: number|null }
  tipo_atendimento_id?: number
  valor_mensal?: number
  percentual_desconto?: number       // 0–100
  // todos opcionais; corpo vazio é 400 (na rota)

NormalizedPlanDay (novo):
  dia: DayName · hora: string · profissional: { id: number|null, nome: string|null }
  sala: number|null · lotado: boolean|null      // null no GET, boolean no PUT

NormalizedRecurringPlan (novo):
  id: number · cliente_id: number · servico: { id: number, nome: string }
  dias: NormalizedPlanDay[] · valor_mensal: number|null · percentual_desconto: number
  dia_vencimento: number · limite_semanal: number|null
  aviso?: string                     // só quando limite_semanal é null (FR-04)
  horarios: string · raw?: Record<string, any>   // só com ?raw=1

Assinaturas exportadas (stubs `throw new Error('not implemented')`):
  parseWeeklyLimit(nome: string): number | null
  weekdayFields(dias: PlanDay[]): Record<string, any>
  toMonthYear(iso: string | null): string
  resolveEditPrice(raw: any, tipoNovo: any | null, valorMensal?: number): { valor_congelado: number | null; congelar_valor: boolean }
  buildPlanEditPayload(raw: any, input: RecurringPlanEditInput, dias: PlanDay[] | null,
                       price: { valor_congelado: number | null; congelar_valor: boolean }, tipoNovo: any | null): Record<string, any>
  normalizeRecurringPlan(raw: any, tipo: any, opts: { assigned?: AssignedDay[]; profissionais?: any[]; includeRaw?: boolean }): NormalizedRecurringPlan
  updateRecurringPlan(planId: number | string, payload: Record<string, any>): Promise<{ success: boolean }>
  countRequestedDays(dias: DayRequest[]): number
```

**Reuse:**
- `DAY_NAMES`, `DayName`, `PlanDay` — `src/services/recurring-plans.ts:12-22, 60-65`
- `DayRequest`, `AssignedDay` — `src/services/slot-assignment.ts:67-72, 14-27` (importar tipos; não duplicar)

## Files
- **Write:** `src/services/recurring-plans.ts` — novos tipos logo após `PlanDay` (linha 65); stubs ao final do arquivo (após linha 340). Não alterar nada existente.
- **Write:** `scripts/check-payloads.ts` — anexar ao final (após linha 118) um bloco `// --- contract: NormalizedRecurringPlan ---` com `const expectedPlan: NormalizedRecurringPlan = {...}` (id 0 ou o id do HAR; `dias: [{dia:'quinta', hora:'10:00', profissional:{id:null,nome:null}, sala:null, lotado:null}]`, `limite_semanal:1`, `dia_vencimento:2`) e `const emptyEdit: RecurringPlanEditInput = {}`, mais um `console.log('✔ contract types')`.
- **Read for pattern:** `src/services/recurring-plans.ts` — lines 9-22 (imports, `DAY_NAMES`, `DayName`), 60-65 (`PlanDay`), 99-105 (`ResolvedPrice`, note a chave `congelar`, distinta de `congelar_valor` do upstream).
- **Read for pattern:** `src/services/slot-assignment.ts` — lines 14-34, 67-72.
- **Read for pattern:** `scripts/check-payloads.ts` — lines 1-16 (cabeçalho com o comando de execução e imports).

## Tests
- **Spec file:** `scripts/check-payloads.ts`
- **Cases:** `contract types` — o bloco de tipagem compila e imprime `✔ contract types`.
- **Command:** `npx tsc --noEmit -p . && SEUFISIO_USER=x SEUFISIO_PASSWORD=x SEUFISIO_CLIENT_SECRET=x API_SECRET_TOKEN=x npx tsx scripts/check-payloads.ts`
- A **red run is required before implementation**: escreva o bloco no `check-payloads.ts` primeiro; `tsc` deve falhar com `Cannot find name 'NormalizedRecurringPlan'`. Paste the failing output in the report.

## Project rules that apply
- CLAUDE.md · "New upstream calls should go through `services/seufisio-client.ts`" — o stub `updateRecurringPlan` só declara a assinatura; nenhuma chamada aqui.
- CLAUDE.md · "Import the `env` object; do not read `process.env` directly" — não tocar em env.
- CLAUDE.md · `scripts/check-payloads.ts` confere funções puras contra capturas; a invocação está no cabeçalho do arquivo.

## Do not
- Open `03-spec.md` or `04-plan.md` — everything you need is in this ticket.
- Read whole files over 300 lines; use ranges (`recurring-plans.ts` tem 340 linhas).
- Implementar lógica em qualquer stub; renomear ou mover funções existentes.
- Run the full test suite mid-ticket (não há suíte; rode só o comando acima).

## Report back (≤1.5k chars, this exact shape)
```
Ticket: 01-contract-tipos-plano-recorrente · <state: done | blocked>
Branch: <branch> (worktree <path>)
Commits: <sha> test: … / <sha> feat: …
Files: <path>, <path>
Tests: <command> → <result>
Red run: <the failing assertion / first failure line>
Deviations: <none, or one line each with why>
Blocked on: <only when state is blocked>
```
