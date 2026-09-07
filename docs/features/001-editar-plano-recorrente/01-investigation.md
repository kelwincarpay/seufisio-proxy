# 001-editar-plano-recorrente · Investigation

Size mantido: M (uma camada, rota + reuso de serviços existentes; sem entidade nova).

## Where it lives
- Leitura do plano recorrente — `src/routes/plans.ts:299` (`GET /api/plans/recurring/:planId?cliente_id=`) → hoje indireto via `GET /api/cliente/:id/listar-vendas?tab=ativas` filtrado por id. `src/services/recurring-plans.ts:274` já exporta `getRecurringPlan()` → `GET /api/cliente-servico/:id`, **não usada por nenhuma rota**.
- Escrita do plano recorrente — **não existe**. `PUT /api/plans/:planId/schedule` (`plans.ts:458`) e `GET /api/plans/:planId` (`plans.ts:358`) são de `pacote` (`/api/pacote/...`), fora do escopo.
- Criação (padrão a espelhar) — `src/routes/plans.ts:60` `POST /api/plans` → `validatePlan()` → `assignProfessionals()` → `resolvePrice()` → `buildPlanPayload()` → `POST /api/cliente-servico/validar-criacao` (409 `needs_confirmation` sem `confirmar:true`) → `POST /api/cliente-servico`.
- Captura do fluxo de edição — `reqs/editar-plano-cliente.har` (único HAR do repo; **não** está em `capturas/`, e ainda não foi convertido em `docs/`). Cliente 322, plano 125.

### Fluxo upstream capturado (edição)
- Leituras: `GET /api/cliente/322`, `/api/cliente/322/servicos-pacotes-ativos`, `/api/cliente-servico/125`, `/api/servico-ciclo?servico_id=125`, `/api/cliente-servico/primeiro-ciclo/125`, `/api/cliente-servico/ultimo-ciclo/125`, `/api/tipo-atendimento/8`, `/api/sala?rowsPerPage=all`, `/api/profissional/todos-profissionais`, `/api/user?rowsPerPage=all`.
- Escrita: **`PUT /api/cliente-servico/125`, objeto completo** (todas as chaves do GET ecoadas + `possui_data_encerramento`). Não há `validar-criacao` nem PATCH. Sucesso: `200 {"success":true}` sem eco do objeto (exige re-GET).
- Diff GET→PUT na captura: `dia_padrao_cobranca` 2→"15"; `data_encerramento` "2027-01-01"→"01/2027" (MM/YYYY na escrita, data completa na leitura); `possui_data_encerramento` null→true; `percentual_desconto` "0.0000"→0.
- Grade semanal: 7 dias × (`{dia}` boolean, `hora_{dia}`, `profissional_id_{dia}`, `sala_id_{dia}`), mesma semântica de `docs/criar-plano-recorrente.md:124` (string vazia para hora sem uso, ids null).

## Existing patterns to reuse
- `assignProfessionals(requested: DayRequest[], inicioServico)` — `src/services/slot-assignment.ts:87-171`. Único resolvedor de profissional/sala por dia da semana + hora: converte dia em próxima ocorrência (`nextOccurrence`, âncora = max(inicio, hoje)), consulta `GET /api/slots/calendario` via `getSlotsForDate` (`src/services/calendar.ts:37-75`), escolhe slot com vaga (senão o mais cheio, `lotado:true`). Sem slot no horário → `AssignmentProblem` → 400 com `horarios_disponiveis`. Único call site hoje: `plans.ts:136`. Reutilizável sem alteração; só a âncora de data precisa ser a data efetiva da edição em vez de `inicio_servico`.
- `buildPlanPayload()`, `resolvePrice()`, `monthlyValue()`, `endMonth()` — `src/services/recurring-plans.ts:93,122,205`. Já produzem o objeto completo de `cliente-servico` (53 campos conferidos contra o HAR de criação) com regra de preço: periodicidade 1 → segue tabela (`congelar:false`); >1 ou valor custom → congela.
- `getRecurringPlan()` — `recurring-plans.ts:274`, leitura direta pronta.
- `getPlanSalesRow` / `getPlanCycleId` / `findCycleCharge` + `applyDiscount` (`src/services/charges.ts`) — lado de dinheiro/cobrança; `charges.ts` é também o precedente de **PUT de objeto completo**.
- `scheduleText()` — texto "terça e quinta às 9h" para cópia de WhatsApp.
- Padrão de erro de fato — `res.status(500).json({ error: '<msg>', details: error?.response?.data || error.message })` em `plans.ts:282,344,411,516`, `customers.ts:161`, `charges.ts:90`, `onboarding.ts:48`, `nf.ts`. Sem classe de erro, sem interceptor, sem helper compartilhado; o status upstream não é repassado (tudo vira 500). Exceção: `charges.ts:139-144` mapeia 400 por regex na mensagem. Validação de entrada: manual, 400 `{ error: 'Missing or invalid ...' }` (`charges.ts:99`), `validatePlan()` em `plans.ts`.
- Documentação — `docs/api-specs.md` é o único doc dos endpoints **do proxy** (TOC → seção por endpoint com request/response → "Error Reference"). Specs upstream seguem `_template.md` (CURL + JSON por passo, "Regra de negócio acordada"), geradas por `npm run har -- capturas/<flow>.har --out docs/<flow>.md` (`docs/como-capturar-requests.md:22-38`).

## Domain terms and decisions in force
- `domain_docs: []` — sem glossário nem ADRs no repo.
- **cliente-servico** — plano recorrente (serviço); distinto de **pacote** (por quantidade de sessões). `docs/criar-plano-recorrente.md`.
- **periodicidade** — meses do ciclo (1|2|3|4|6|8|12); define campo de valor em `VALOR_FIELD` (`recurring-plans.ts:41-47`).
- **Nx na Semana** — a frequência semanal do serviço existe **só no texto** de `tipo_atendimento.nome` ("Pilates 1x/2x/3x na Semana", `docs/attendance-types.md:180,240,300`). `cliente-servico` tem `total_atendimentos_semanais_ciclo`, mas vem `null` na captura. A frequência real do plano é o número de flags `domingo..sabado` true. **Nenhuma validação de limite semanal existe hoje no proxy.**
- **lotado** — slot sem vaga; na criação não bloqueia, só sinaliza (`slot-assignment.ts:24`).

## Data and contracts touched
- Upstream: `GET/PUT /api/cliente-servico/:id` (novo uso do PUT), `GET /api/tipo-atendimento/:id`, `GET /api/slots/calendario` (existente), `GET /api/cliente/:id/listar-vendas` (existente).
- Proxy: novos endpoints em `/api/plans/...` (leitura completa + edição do plano recorrente). Contrato de erro: `{ error, details }`.
- Supabase: **nenhum**. `client_onboarding` guarda só `plano_id`/estado/contratos; `onboarding_log.provider_response` é opaco; `reminder-cron.ts:148` lê a agenda ao vivo do SeuFisio. Só importaria se o `plano_id` mudasse, o que a edição não faz.

## Test coverage today
- Não há `*.test.ts`/`*.spec.ts` nem script de test/lint.
- `scripts/check-payloads.ts:1-16` — confere funções puras contra o HAR: `monthlyValue, periodicidadeLabel, endMonth, resolvePrice, buildPlanPayload (diff de 53 campos), retroactiveSessions, scheduleText, discountNote, formatBRL, missingRegistrationFields, onboarding-messages, nextOccurrence`. É o lugar para fixar o novo builder de payload de edição contra `reqs/editar-plano-cliente.har`.

## Facts still missing
- Corpo de erro do `PUT /api/cliente-servico/:id` (status e formato): a captura só tem o caso feliz. Exige gravar um HAR com payload inválido/horário em conflito.
- Se o PUT aceita mudança de `tipo_atendimento_id` e de `percentual_desconto`/`valor_congelado`, e o que acontece com a cobrança do ciclo corrente.
- Se `total_atendimentos_semanais_ciclo` é preenchido em outros planos (só um exemplo, `null`).
- Se `reqs/*.har` está no `.gitignore` (o HAR carrega token; a convenção protege só `capturas/` e `*.har`).
- Semântica exata de "vencimento" para o atendente: `dia_padrao_cobranca`, `dia_padrao_renovacao` ou `data_encerramento` (a captura alterou o 1º e o 3º).

## Decisions

### Business
- **open** · `open` — Quando os dias pedidos excedem o "Nx na Semana" do serviço: bloquear, avisar e exigir `confirmar:true` (padrão do 409 da criação), ou sugerir trocar o serviço para o Nx correspondente?
  - Decision / lean: avisar com 409 `needs_confirmation` + sugestão do serviço equivalente.
  - Evidence: `src/routes/plans.ts:60` (padrão 409); `docs/attendance-types.md:180`.
- **open** · `open` — O que "editar vencimento" significa para o atendente: dia de cobrança (`dia_padrao_cobranca`), dia de renovação (`dia_padrao_renovacao`) ou data de encerramento (`data_encerramento`)? Expor os três?
  - Decision / lean: expor os três com nomes claros; a captura mexeu em cobrança e encerramento.
  - Evidence: `reqs/editar-plano-cliente.har` diff GET→PUT.
- **open** · `open` — Ao trocar o serviço (`tipo_atendimento_id`) ou a periodicidade, o preço deve ser recalculado por `resolvePrice()` ou o `valor_congelado` atual deve ser mantido? Desconto (`percentual_desconto`) é editável pela skill?
  - Decision / lean: recalcular só se o atendente não informar valor; manter congelado caso contrário.
  - Evidence: `src/services/recurring-plans.ts:122`.
- **open** · `open` — Slot `lotado` no novo horário: aceitar como na criação (só sinalizar) ou bloquear a edição?
  - Decision / lean: igual à criação (sinalizar, não bloquear).
  - Evidence: `src/services/slot-assignment.ts:24`.
- **open** · `open` — A edição deve disparar alguma mensagem WhatsApp (novo horário para o cliente) ou nada?
  - Decision / lean: nada nesta feature; devolver `scheduleText()` para a skill usar se quiser.
  - Evidence: `src/services/recurring-plans.ts` (`scheduleText`).

### Layout
- Nenhuma: API only (`layout_references: []`).

### Technical
- **AD-01** · `settled` — Forma da escrita upstream: PUT de objeto completo em `/api/cliente-servico/:id`, GET → merge → PUT → re-GET.
  - Evidence: `reqs/editar-plano-cliente.har`; precedente `src/services/charges.ts`.
- **AD-02** · `settled` — Profissional/sala por dia+hora via `assignProfessionals()` com âncora na data efetiva da edição.
  - Evidence: `src/services/slot-assignment.ts:87-171`; `src/routes/plans.ts:136`.
- **AD-03** · `default` — Erros no formato `{ error, details: upstream.data || message }` (500) e 400 `{ error, problemas[] }` para falhas de slot.
  - Evidence: `plans.ts:282,344,411,516`, `customers.ts:161`, `charges.ts:90`, `onboarding.ts:48`.
- **AD-04** · `default` — Rotas novas em `src/routes/plans.ts` sob `/api/plans/recurring/:planId` (GET completo + PUT), sem router novo.
  - Evidence: `src/routes/plans.ts:299` já tem `GET /recurring/:planId`.
- **AD-05** · `settled` — Nenhuma escrita no Supabase.
  - Evidence: `supabase/onboarding.sql:10-32`; `src/services/reminder-cron.ts:148`.
- **AD-06** · `default` — Validação de entrada manual (estilo `validatePlan()`), sem zod; 400 `{ error }`.
  - Evidence: `src/routes/plans.ts` (`validatePlan`), `charges.ts:99`.
- **AD-07** · `settled` — Formatos de data e campos fixos do payload reutilizam `buildPlanPayload()`/`endMonth()` (`data_encerramento` MM/YYYY na escrita).
  - Evidence: `docs/criar-plano-recorrente.md:~175`; `recurring-plans.ts:205`.
- **AD-08** · `settled` — Builder do payload de edição fixado em `scripts/check-payloads.ts` contra o HAR de edição; HAR convertido em `docs/editar-plano-recorrente.md` via `npm run har`.
  - Evidence: `scripts/check-payloads.ts:1-16`; `docs/como-capturar-requests.md:22-38`.
- **AD-09** · `settled` — MD para a skill segue a estrutura de `docs/api-specs.md` (seção por endpoint, request/response, Error Reference), conteúdo em pt-BR (`docs_language`).
  - Evidence: `docs/api-specs.md`; `.kss/config.md`.
- **open** · `open` — Fonte do limite semanal: regex `/(\d+)x\s*na\s*semana/i` em `tipo_atendimento.nome` (única fonte com o limite), com fallback quando o nome não casa (sem limite? bloquear?). `total_atendimentos_semanais_ciclo` vem null.
  - Decision / lean: regex no nome; sem match → não validar e avisar na resposta.
  - Evidence: `docs/attendance-types.md:180,240,300`; `reqs/editar-plano-cliente.har`.
- **open** · `open` — Forma da resposta de leitura para a skill: objeto bruto do `cliente-servico` ou normalizado (`dias[{dia,hora,profissional}]`, `valor_mensal`, `horarios`) como o `POST /api/plans` devolve?
  - Decision / lean: normalizado, espelhando a resposta do POST, com `raw` opcional.
  - Evidence: `src/routes/plans.ts:60` (shape do 201).
- **open** · `open` — Repassar o status HTTP upstream (400/409/422) em vez de forçar 500, como a maioria faz hoje? A brief pede "mesmo formato", mas a skill precisa distinguir erro do usuário.
  - Decision / lean: manter `{error, details}` e repassar o status upstream quando for 4xx.
  - Evidence: `charges.ts:139-144` (único que mapeia 400).
