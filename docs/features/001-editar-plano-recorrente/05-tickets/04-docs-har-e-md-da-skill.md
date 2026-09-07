# 04 · Docs — HAR convertido, `.gitignore` e MD da skill

**Layer:** docs · **Blocked by:** 01 · **Blocks:** 05 ·
**Model:** sonnet · **Effort:** medium · **Helpers:** none ·
**Est.:** 15 turns · **Worktree:** yes

## Goal
Entregar a documentação da feature: converter `reqs/editar-plano-cliente.har` em
`docs/editar-plano-recorrente.md` com `npm run har`, acrescentar `reqs/` ao `.gitignore`, e escrever
`docs/plano-recorrente-api.md` em pt-BR, na estrutura de `docs/api-specs.md` (seção por endpoint com
Endpoint / Purpose / Request / Business Logic / Success / Error Responses, mais Error Reference), cobrindo o
`GET` e o `PUT /api/plans/recurring/:planId`, limite semanal, `lotado`, `horarios`, `?raw=1`, códigos de
erro e uma seção "O que mudou" para a skill do OpenClaw. Os shapes vêm do ticket 01 e deste ticket, não do código.

## Requirements covered
- **FR-25** · Given o HAR `reqs/editar-plano-cliente.har`, when a feature é entregue, then ele está convertido em `docs/editar-plano-recorrente.md` e o builder do payload de edição está conferido contra o HAR em `scripts/check-payloads.ts`. [AD-08] — este ticket cobre a conversão; o check é do ticket 02.
- **FR-26** · Given a feature entregue, when a skill precisa ser atualizada, then existe um MD em `docs/` em pt-BR, na estrutura de `docs/api-specs.md` (seção por endpoint, request/response, Error Reference), cobrindo leitura, edição, limite semanal, `lotado`, `horarios` e códigos de erro. [AD-09, D-07, D-08]
- **NFR-04** · o HAR fica fora do git; só o MD derivado é versionado.

## Plan excerpt

| File | Action | Layer | Why (FR) |
| --- | --- | --- | --- |
| `docs/editar-plano-recorrente.md` | create | docs | saída de `npm run har`; nenhum doc existente cobre o PUT de `cliente-servico` — FR-25, NFR-04 |
| `docs/plano-recorrente-api.md` | create | docs | MD da skill em pt-BR. Considerados: `docs/api-specs.md` (inglês, rotas antigas, 909 linhas) e `ATUALIZACAO-SKILL-OPENCLAW.md` (fora de `docs/`, escopo geral) — FR-26, AD-09 |
| `.gitignore` | modify | infra | adicionar `reqs/`; hoje só `capturas/` e `*.har` — NFR-04 |

**Contract shapes (documentar exatamente assim):**
```
GET /api/plans/recurring/:planId[?raw=1]            header: Authorization do API_SECRET_TOKEN (como as demais rotas /api)
  200 NormalizedRecurringPlan:
    { id, cliente_id, servico:{id,nome}, dias:[{dia, hora, profissional:{id,nome}, sala, lotado:null}],
      valor_mensal, percentual_desconto, dia_vencimento, limite_semanal, aviso?, horarios, raw? }
  upstream 4xx → mesmo status { error, details } · 5xx/rede → 500 { error, details }

PUT /api/plans/recurring/:planId[?raw=1]
  body (todos opcionais, corpo vazio = 400):
    { dia_vencimento?: 1–31, dias?: [{ dia: "segunda"…"domingo", hora: "HH:mm", profissional_id?: number|null }],
      tipo_atendimento_id?: number, valor_mensal?: number, percentual_desconto?: 0–100 }
  200 NormalizedRecurringPlan com dias[].lotado boolean (true = turma cheia, edição gravada mesmo assim)
  400 { error }                                                    tipo/formato
  400 { error, problemas:[...] }                                   dia/hora sem slot na grade
  400 { error, limite_semanal, dias_pedidos, servico }             excede o limite do serviço (sem confirmação)
  upstream 4xx/5xx como no GET

Regras a explicar: limite_semanal vem do nome do serviço ("Nx na Semana", case-insensitive; null + aviso quando não casa,
  e então o limite não é validado); ao trocar tipo_atendimento_id o limite é o do novo serviço; preço: valor_mensal
  informado congela; serviço trocado sem valor recalcula pela regra da criação; nada mudou mantém o lido;
  dia_vencimento grava dia_padrao_cobranca e NÃO mexe em dia_padrao_renovacao/data_encerramento; profissional
  informado prevalece sobre a grade; âncora da grade = hoje; nenhuma mensagem WhatsApp e nenhuma escrita em Supabase.
O que mudou (para a skill): GET não aceita mais ?cliente_id=; deixam de existir atendimentos_feitos,
  atendimentos_repor, validade, pausado_em; novos campos percentual_desconto, dia_vencimento, limite_semanal, horarios, lotado.
```

**Reuse:**
- Conversão HAR → MD — `scripts/har-to-spec.ts`; passos em `docs/como-capturar-requests.md:22-38`; script `npm run har -- <har> --out <md>`
- Estrutura de doc de endpoint — `docs/api-specs.md:191-369` (seção "API 1 — TotalPass: Match by CPF") e Error Reference `docs/api-specs.md:729-760`
- Doc antiga da rota GET (o que a skill conhece hoje) — `ATUALIZACAO-SKILL-OPENCLAW.md:255-346` (§ 17 "Get Recurring Plan")

## Files
- **Write:** `docs/editar-plano-recorrente.md` — gerado; revisar que não há token/cookie/`Authorization` no MD antes de commitar.
- **Write:** `docs/plano-recorrente-api.md` — novo, pt-BR, ~150–250 linhas.
- **Write:** `.gitignore` — adicionar linha `reqs/` (arquivo tem 14 linhas).
- **Read for pattern:** `docs/api-specs.md` — lines 191-369 e 729-760.
- **Read for pattern:** `ATUALIZACAO-SKILL-OPENCLAW.md` — lines 255-346.
- **Read for pattern:** `docs/como-capturar-requests.md` — lines 22-38.
- **Read for pattern:** `src/services/recurring-plans.ts` — só os tipos do ticket 01 (final do arquivo), para conferir nomes de campo.

## Tests
- **Spec file:** não há seam automatizado para docs.
- **Cases:**
  - `har convertido` — `npm run har -- reqs/editar-plano-cliente.har --out docs/editar-plano-recorrente.md` sai 0 e o MD lista o `GET` e o `PUT /api/cliente-servico/:id`
  - `sem segredo` — `grep -iE 'authorization|bearer|cookie' docs/editar-plano-recorrente.md` não encontra valores de token
  - `gitignore` — `git check-ignore reqs/editar-plano-cliente.har` responde o caminho
  - `md da skill` — contém as seções Endpoint/Purpose/Request/Business Logic/Success/Error Responses para GET e PUT, Error Reference e "O que mudou"
- A **red run is required before implementation**: `test -f docs/editar-plano-recorrente.md && test -f docs/plano-recorrente-api.md && git check-ignore -q reqs/` deve falhar antes. Paste the failing output in the report.

## Project rules that apply
- CLAUDE.md · "To document a new upstream flow: record it in the browser and convert the HAR with `npm run har`".
- CLAUDE.md · "HAR files carry a live token, so `capturas/` and `*.har` are gitignored" — nunca commitar o HAR; `reqs/` entra no `.gitignore`.
- CLAUDE.md · os `.md` em `docs/` são specs de API/comportamento — o novo MD segue esse papel.
- `.kss/config.md` · `docs_language: pt-BR`; nomes de campos, headings e identificadores em inglês.

## Do not
- Open `03-spec.md` or `04-plan.md` — everything you need is in this ticket.
- Read whole files over 300 lines; use ranges (`api-specs.md` tem 922 linhas). Nunca `cat` o HAR.
- Editar `docs/api-specs.md` ou `ATUALIZACAO-SKILL-OPENCLAW.md`.
- Inventar campos fora dos shapes acima; documentar `dia_padrao_renovacao`/`data_encerramento` como editáveis.
- Run the full test suite mid-ticket.

## Report back (≤1.5k chars, this exact shape)
```
Ticket: 04-docs-har-e-md-da-skill · <state: done | blocked>
Branch: <branch> (worktree <path>)
Commits: <sha> test: … / <sha> feat: …
Files: <path>, <path>
Tests: <command> → <result>
Red run: <the failing assertion / first failure line>
Deviations: <none, or one line each with why>
Blocked on: <only when state is blocked>
```
