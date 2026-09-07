# 001-editar-plano-recorrente · Spec

Cap 15k chars. Over cap the skill refuses and asks for the feature to be split.

## Problem
A skill do SeuFisio no OpenClaw não consegue editar um plano recorrente (`cliente-servico`) já vendido: o proxy não expõe leitura completa nem escrita do plano. O atendente abre o SeuFisio na mão para alterar vencimento, dias/horários, profissional, preço ou serviço, e a skill não tem como orientá-lo sobre o limite semanal do serviço nem mostrar erros do SeuFisio.

## Solution
O proxy passa a expor, sob `/api/plans/recurring/:planId`, a leitura detalhada e a edição (PUT) de um plano recorrente. A edição segue GET → aplicar mudanças → PUT de objeto completo → re-GET, reutilizando a resolução de profissional/sala por grade e turma da criação, a regra de preço e o texto de horários. Antes de escrever, o proxy valida o número de dias pedidos contra o "Nx na Semana" do serviço e rejeita excesso com 400. Erros locais respondem 400 e erros 4xx do SeuFisio são repassados com o mesmo status, sempre no corpo `{ error, details }`. Um MD em `docs/` descreve os endpoints para a atualização da skill.

## User stories
- **US-1** — As a atendente da MovArt, I want alterar o dia de vencimento de um plano recorrente pela skill, so that a cobrança mensal do cliente saia no dia combinado sem abrir o SeuFisio.
- **US-2** — As a atendente da MovArt, I want alterar os dias e horários de atendimento de um plano com o profissional resolvido pela grade/turma, so that a agenda do cliente reflita o novo combinado.
- **US-3** — As a atendente da MovArt, I want ser avisado quando os dias pedidos excedem o limite semanal do serviço, so that eu troque o serviço ou reduza os dias antes de gravar.
- **US-4** — As a atendente da MovArt, I want alterar serviço, valor mensal e desconto do plano, so that uma negociação caso a caso seja refletida na cobrança.
- **US-5** — As a skill SeuFisio no OpenClaw, I want ler o plano em formato normalizado e receber erros em formato e status previsíveis, so that eu apresente estado e falhas ao atendente sem parsear objetos brutos.
- **US-6** — As a mantenedor da skill, I want um MD em `docs/` descrevendo os novos endpoints, so that eu atualize a skill do OpenClaw sem ler o código do proxy.

## Functional requirements

### Leitura
- **FR-01** · Given um plano recorrente existente, when a skill chama `GET /api/plans/recurring/:planId`, then o proxy lê o `cliente-servico` upstream por id e responde 200 com o plano normalizado espelhando o 201 do POST /api/plans, mais `percentual_desconto`, `dia_vencimento`, `limite_semanal` e `horarios`. [D-07, AD-04, AD-01]
- **FR-02** · Given a leitura ou a edição, when a query traz `raw=1`, then a resposta inclui `raw` com o objeto `cliente-servico` bruto do SeuFisio; sem `raw=1`, o campo é omitido. [D-07]
- **FR-03** · Given um serviço cujo `tipo_atendimento.nome` casa com `/(\d+)x\s*na\s*semana/i`, when o plano é lido ou editado, then `limite_semanal` traz o inteiro capturado. [D-06]
- **FR-04** · Given um serviço cujo nome não casa com a regex, when o plano é lido ou editado, then `limite_semanal` é `null` e a resposta traz um aviso textual de que o limite não pôde ser determinado. [D-06]

### Edição · entrada e validação local
- **FR-05** · Given um plano recorrente existente, when a skill chama `PUT /api/plans/recurring/:planId`, then o proxy faz GET do `cliente-servico`, aplica só os campos informados sobre o objeto lido, envia PUT de objeto completo em `/api/cliente-servico/:id` e responde com o estado obtido por um novo GET. [AD-01, AD-04]
- **FR-06** · Given o corpo da edição, when os campos informados falham em tipo ou formato (dia do mês fora de 1–31, hora inválida, dia da semana desconhecido, `tipo_atendimento_id` não numérico), then o proxy responde 400 `{ error }` sem chamar o upstream. [AD-06, D-08]
- **FR-07** · Given `dia_vencimento` informado, when a edição é aplicada, then o proxy grava o valor em `dia_padrao_cobranca` e preserva `dia_padrao_renovacao` e `data_encerramento` conforme lidos, sem expor esses dois campos como editáveis. [D-02, AD-07]
- **FR-08** · Given o objeto lido, when o payload de PUT é montado, then campos fixos e formatos de data seguem o builder da criação (`data_encerramento` em MM/YYYY na escrita, `dia_padrao_*` como dia do mês, `possui_data_encerramento` coerente). [AD-07, AD-01]
- **FR-09** · Given dias/horários informados e `limite_semanal` determinado, when a contagem de dias pedidos excede o limite, then o proxy responde 400 informando o limite do serviço atual e a quantidade pedida, sem opção de confirmação e sem chamar o PUT. [D-01, D-06]
- **FR-10** · Given dias/horários informados e `limite_semanal` igual a `null`, when a edição é aplicada, then o proxy não valida o limite e prossegue com a escrita. [D-06]
- **FR-11** · Given a edição troca `tipo_atendimento_id`, when o limite semanal é avaliado, then o limite usado é o do novo serviço, não o do serviço anterior. [D-01, D-06]

### Edição · dias, horários e profissional
- **FR-12** · Given dias/horários informados sem `profissional_id`, when a edição é aplicada, then o proxy resolve profissional e sala de cada dia/hora pela grade e turma com âncora na data efetiva da edição, e grava `profissional_id_{dia}` e `sala_id_{dia}`. [AD-02]
- **FR-13** · Given um dia/horário informado com `profissional_id`, when a edição é aplicada, then o valor informado prevalece sobre a resolução pela grade. [AD-02]
- **FR-14** · Given dias/horários informados, when a grade semanal é gravada, then os sete dias são escritos com a mesma semântica da criação: flag do dia, hora, profissional e sala, com string vazia e ids nulos nos dias sem uso. [AD-07, AD-01]
- **FR-15** · Given um dia/horário cujo slot está lotado, when a edição é aplicada, then a edição prossegue e o dia correspondente na resposta traz `lotado: true`; dias com vaga trazem `lotado: false`. [D-04]
- **FR-16** · Given a edição concluída, when a resposta é montada, then ela inclui `horarios` com o texto de agenda gerado pela mesma função da criação, e nenhuma mensagem WhatsApp é enviada pelo proxy. [D-05]

### Edição · preço
- **FR-17** · Given `valor_mensal` informado, when a edição é aplicada, then ele passa a ser o novo `valor_congelado`, independentemente de troca de serviço. [D-03]
- **FR-18** · Given `valor_mensal` ausente e `tipo_atendimento_id` alterado, when a edição é aplicada, then o valor é recalculado pela regra de preço da criação para o novo serviço e periodicidade. [D-03]
- **FR-19** · Given `valor_mensal` ausente e serviço inalterado, when a edição é aplicada, then o `valor_congelado` lido é mantido. [D-03]
- **FR-20** · Given `percentual_desconto` informado, when a edição é aplicada, then o valor é gravado no plano e devolvido na resposta normalizada. [D-03, D-07]

### Erros
- **FR-21** · Given o SeuFisio responde 4xx a qualquer chamada da edição ou leitura, when o proxy monta a resposta, then ele repassa o mesmo status HTTP com corpo `{ error, details }`, onde `details` é o corpo upstream ou a mensagem. [D-08]
- **FR-22** · Given o SeuFisio responde 5xx ou a chamada falha por rede, when o proxy monta a resposta, then ele responde 500 com corpo `{ error, details }`. [D-08]
- **FR-23** · Given uma falha de validação local, when o proxy responde, then o status é 400 e o corpo mantém a chave `error`. [D-08, AD-06]

### Dados locais e documentação
- **FR-24** · Given uma edição concluída, when o proxy termina o fluxo, then nenhuma escrita é feita no Supabase. [AD-05]
- **FR-25** · Given o HAR `reqs/editar-plano-cliente.har`, when a feature é entregue, then ele está convertido em `docs/editar-plano-recorrente.md` e o builder do payload de edição está conferido contra o HAR em `scripts/check-payloads.ts`. [AD-08]
- **FR-26** · Given a feature entregue, when a skill precisa ser atualizada, then existe um MD em `docs/` em pt-BR, na estrutura de `docs/api-specs.md` (seção por endpoint, request/response, Error Reference), cobrindo leitura, edição, limite semanal, `lotado`, `horarios` e códigos de erro. [AD-09, D-07, D-08]

## Non-functional requirements
- **NFR-01** — Os endpoints ficam sob `/api` e exigem o secret token de `secretTokenAuth` — required by CLAUDE.md § Conventions ("All business/proxy endpoints live under `/api` and require the secret token").
- **NFR-02** — Toda chamada upstream nova passa pelo cliente compartilhado que reutiliza o token do SeuFisio — required by CLAUDE.md § Conventions ("New upstream calls should go through `services/seufisio-client.ts`").
- **NFR-03** — Configuração é lida só do objeto `env`, nunca de `process.env` diretamente — required by CLAUDE.md § Architecture (`src/config/env.ts`).
- **NFR-04** — O fluxo upstream de edição fica documentado a partir do HAR via `npm run har`, e o HAR não é versionado — required by CLAUDE.md § Conventions ("To document a new upstream flow… HAR files carry a live token").

## Test seams
- Builder do payload de edição (merge GET → PUT, campos ecoados, MM/YYYY, `possui_data_encerramento`) — existing — `scripts/check-payloads.ts` vs `reqs/editar-plano-cliente.har`
- Regra de preço na edição (`valor_mensal` / serviço trocado / manter congelado) — existing — `scripts/check-payloads.ts`
- Parse do limite semanal (regex, `null` sem match) e contagem de dias pedidos — existing — `scripts/check-payloads.ts`
- Texto de `horarios` na resposta normalizada — existing — `scripts/check-payloads.ts`
- Fixture do fluxo upstream: HAR convertido em `docs/editar-plano-recorrente.md` — existing — `docs/como-capturar-requests.md`

Comportamento de rota (status 400/4xx repassado/500, `lotado`, `raw`) não tem seam automatizado no repo; é verificado manualmente contra o MD da skill (FR-26).

## Contracts and data
- `GET /api/plans/recurring/:planId` (proxy, resposta normalizada + `raw` opcional) — `docs/adr/0001-contrato-plano-recorrente-normalizado.md`
- `PUT /api/plans/recurring/:planId` (proxy, corpo com campos opcionais: `dia_vencimento`, dias/horários com `profissional_id` opcional, `tipo_atendimento_id`, `valor_mensal`, `percentual_desconto`) — `docs/adr/0001-contrato-plano-recorrente-normalizado.md`
- Erro `{ error, details }` com status 4xx repassado / 500 — `docs/adr/0002-repasse-status-4xx-upstream.md`
- Upstream `GET/PUT /api/cliente-servico/:id` (PUT de objeto completo, sucesso `200 {"success":true}`) — `reqs/editar-plano-cliente.har` → `docs/editar-plano-recorrente.md`
- Upstream `GET /api/tipo-atendimento/:id` (fonte do nome do serviço para o limite semanal) — `docs/attendance-types.md`
- Upstream `GET /api/slots/calendario` (grade para resolução de profissional/sala) — existente, sem alteração
- Supabase — nenhuma tabela tocada (AD-05)

## Layout
- n/a — feature só de API; o brief não aponta view e `layout_references` está vazio.

## Out of scope
- Cancelar/encerrar o plano ou estornar cobranças.
- Reagendar/editar atendimentos já realizados ou gerenciar individualmente os atendimentos futuros gerados pelo plano.
- Edição de `pacote` (plano por quantidade de sessões).
- Alterar a própria skill no OpenClaw; este repo entrega APIs e o MD.
- Editar `dia_padrao_renovacao` e `data_encerramento` pela skill (D-02).
- Envio automático de WhatsApp na edição (D-05).
- Confirmação para exceder o limite semanal (D-01).

## Open items
- Nenhum `DF-`. Fato ainda não capturado (corpo de erro do PUT upstream em recusa) é coberto por FR-21/FR-22 de forma genérica, sem depender do formato exato.

## Traceability

| Story | FRs |
| --- | --- |
| US-1 | FR-05, FR-07, FR-08 |
| US-2 | FR-05, FR-12, FR-13, FR-14, FR-15, FR-16 |
| US-3 | FR-03, FR-04, FR-09, FR-10, FR-11 |
| US-4 | FR-11, FR-17, FR-18, FR-19, FR-20 |
| US-5 | FR-01, FR-02, FR-21, FR-22, FR-23 |
| US-6 | FR-25, FR-26 |

| Decision | FRs |
| --- | --- |
| D-01 | FR-09, FR-11 |
| D-02 | FR-07 |
| D-03 | FR-17, FR-18, FR-19, FR-20 |
| D-04 | FR-15 |
| D-05 | FR-16 |
| D-06 | FR-03, FR-04, FR-09, FR-10, FR-11 |
| D-07 | FR-01, FR-02, FR-20, FR-26 |
| D-08 | FR-06, FR-21, FR-22, FR-23, FR-26 |
| AD-01 | FR-01, FR-05, FR-08, FR-14 |
| AD-02 | FR-12, FR-13 |
| AD-03 | — (overridden → D-08) |
| AD-04 | FR-01, FR-05 |
| AD-05 | FR-24 |
| AD-06 | FR-06, FR-23 |
| AD-07 | FR-07, FR-08, FR-14 |
| AD-08 | FR-25 |
| AD-09 | FR-26 |

- Decision with no FR: none (AD-03 está overridden, coberta por D-08).
- Story with no FR: none.
- FR blocked by a DF-: none.
