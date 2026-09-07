# 05 · Integration — fio ponta a ponta e verificação da rota

**Layer:** integration · **Blocked by:** 02, 03, 04 · **Blocks:** — ·
**Model:** sonnet · **Effort:** low · **Helpers:** runner ·
**Est.:** 10 turns · **Worktree:** yes

## Goal
Juntar os ramos dos tickets 02, 03 e 04 sobre o 01, resolver os conflitos esperados nos blocos anexados ao
final de `scripts/check-payloads.ts` e nos imports de `recurring-plans.ts`, confirmar que nenhum stub
`not implemented` sobrou, que `tsc` e `npm run build` passam e que `check-payloads.ts` sai só com `✔`. Se
houver `.env` com credenciais reais, subir `npm run dev` e cumprir a lista de verificação manual da rota
contra `docs/plano-recorrente-api.md`; sem `.env`, registrar cada item como "não verificado (sem credenciais)".

## Requirements covered
- **FR-05** · Given um plano recorrente existente, when a skill chama `PUT /api/plans/recurring/:planId`, then o proxy faz GET do `cliente-servico`, aplica só os campos informados sobre o objeto lido, envia PUT de objeto completo em `/api/cliente-servico/:id` e responde com o estado obtido por um novo GET. [AD-01, AD-04]
- **FR-06** · Given o corpo da edição, when os campos informados falham em tipo ou formato (dia do mês fora de 1–31, hora inválida, dia da semana desconhecido, `tipo_atendimento_id` não numérico), then o proxy responde 400 `{ error }` sem chamar o upstream. [AD-06, D-08]
- **FR-09** · Given dias/horários informados e `limite_semanal` determinado, when a contagem de dias pedidos excede o limite, then o proxy responde 400 informando o limite do serviço atual e a quantidade pedida, sem opção de confirmação e sem chamar o PUT. [D-01, D-06]
- **FR-15** · Given um dia/horário cujo slot está lotado, when a edição é aplicada, then a edição prossegue e o dia correspondente na resposta traz `lotado: true`; dias com vaga trazem `lotado: false`. [D-04]
- **FR-21** · Given o SeuFisio responde 4xx a qualquer chamada da edição ou leitura, when o proxy monta a resposta, then ele repassa o mesmo status HTTP com corpo `{ error, details }`, onde `details` é o corpo upstream ou a mensagem. [D-08]
- **FR-23** · Given uma falha de validação local, when o proxy responde, then o status é 400 e o corpo mantém a chave `error`. [D-08, AD-06]
- **FR-25** · Given o HAR `reqs/editar-plano-cliente.har`, when a feature é entregue, then ele está convertido em `docs/editar-plano-recorrente.md` e o builder do payload de edição está conferido contra o HAR em `scripts/check-payloads.ts`. [AD-08]

## Plan excerpt

| File | Action | Layer | Why (FR) |
| --- | --- | --- | --- |
| `src/services/recurring-plans.ts` | merge | service | stubs do 01 substituídos pelo 02; imports sem duplicata |
| `src/routes/plans.ts` | merge | api | rota do 03 chamando as funções reais |
| `scripts/check-payloads.ts` | merge | test | três blocos anexados (01, 02, 03) na ordem, um único `process.exit` no fim |
| `docs/*.md`, `.gitignore` | merge | docs/infra | do 04 |

**Contract shapes:** os do MD gerado pelo ticket 04, `docs/plano-recorrente-api.md` — a verificação manual é
contra ele.

**Reuse:**
- Comando de execução dos checks — cabeçalho de `scripts/check-payloads.ts:1-10`
- Health check sem auth — `GET /health` (`src/index.ts`) para saber que o dev subiu

## Files
- **Write:** apenas resoluções de conflito nos arquivos acima; nenhum arquivo novo.
- **Read for pattern:** `scripts/check-payloads.ts` — os blocos anexados (do final do arquivo original, linha 118, em diante).
- **Read for pattern:** `src/services/recurring-plans.ts` — só a região dos stubs/implementações (final do arquivo).

## Tests
- **Spec file:** `scripts/check-payloads.ts`
- **Cases (automatizados):**
  - `grep -n "not implemented" src/services/recurring-plans.ts` → nenhuma ocorrência
  - `npx tsc --noEmit -p .` → 0 erros; `npm run build` → sai 0
  - `SEUFISIO_USER=x SEUFISIO_PASSWORD=x SEUFISIO_CLIENT_SECRET=x API_SECRET_TOKEN=x npx tsx scripts/check-payloads.ts` → só `✔`, nenhum `DIFF`, exit 0
- **Cases (manuais, só com `.env` real; usar um plano de teste combinado com o estúdio, `?raw=1` para inspecionar):**
  - `GET /api/plans/recurring/:id` → 200 com `limite_semanal`, `dia_vencimento`, `horarios`, `lotado:null`; `?raw=1` traz `raw`
  - `PUT` corpo `{}` → 400 `{ error }`; `{ "dia_vencimento": 40 }` → 400
  - `PUT` com mais dias que o limite → 400 com `limite_semanal` e `dias_pedidos`
  - `PUT` com dia/hora sem slot → 400 `{ problemas }`
  - `PUT` com `dia_vencimento` válido → 200; re-`GET` mostra o novo valor; `dia_padrao_renovacao` no `raw` inalterado
  - `GET /api/plans/recurring/999999999` → 404 (ou o 4xx que o SeuFisio devolver) com `{ error, details }`
- A **red run is required before implementation**: antes do merge, na branch do 01, `grep -c "not implemented" src/services/recurring-plans.ts` deve ser > 0 e `check-payloads` deve falhar. Paste the failing output in the report.

## Project rules that apply
- CLAUDE.md · "There is no test or lint script configured" — os únicos gates são `tsc`, `npm run build` e `check-payloads.ts`.
- CLAUDE.md · "HAR files carry a live token" — confirmar com `git status` que nada de `reqs/` está staged.
- Git · commit só na branch da feature `feat/001-editar-plano-recorrente`; nunca em `main`.

## Do not
- Open `03-spec.md` or `04-plan.md` — everything you need is in this ticket.
- Read whole files over 300 lines; use ranges.
- Reimplementar lógica dos tickets 02/03 ao resolver conflitos; se um conflito exigir decisão de negócio, reportar `blocked`.
- Editar planos reais de clientes sem um plano de teste combinado; sem credenciais, não simular sucesso.
- Run the full test suite mid-ticket (não há suíte).

## Report back (≤1.5k chars, this exact shape)
```
Ticket: 05-integration-fio-e-verificacao · <state: done | blocked>
Branch: <branch> (worktree <path>)
Commits: <sha> test: … / <sha> feat: …
Files: <path>, <path>
Tests: <command> → <result>
Red run: <the failing assertion / first failure line>
Deviations: <none, or one line each with why>
Blocked on: <only when state is blocked>
```
