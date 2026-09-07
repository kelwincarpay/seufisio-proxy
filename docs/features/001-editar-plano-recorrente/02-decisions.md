# 001-editar-plano-recorrente · Decisions

Taken in the grill, one per turn, in the order business → layout → technical.

## D-01 · business

- **Question:** Quando os dias/horários pedidos na edição excedem o "Nx na Semana" do serviço do plano, o que a API deve fazer?
- **Decision:** Rejeitar com 400, sem opção de `confirmar: true`. A resposta informa o limite do serviço atual e quantos dias foram pedidos; o atendente precisa trocar o serviço (`tipo_atendimento_id`) na própria edição ou reduzir os dias.
- **Why:** Evita plano inconsistente (serviço "2x" com 3 atendimentos semanais). Fluxo mais rígido, mas previsível para a skill.
- **Rejected:** 409 `needs_confirmation` (permitiria manter serviço com mais dias do que o nome diz); 409 com sugestão de serviço equivalente (ainda dependia de confirmação).
- **Links:** 01-investigation.md › Decisions › Business item 1; `src/routes/plans.ts:60`; `docs/attendance-types.md:180`
- **Terms:** —

## D-02 · business

- **Question:** O que "editar vencimento" significa para o atendente: dia de cobrança, dia de renovação ou data de encerramento?
- **Decision:** Só o dia de cobrança (`dia_padrao_cobranca`). A API expõe o campo como `dia_vencimento`; `dia_padrao_renovacao` e `data_encerramento` não são editáveis pela skill e são preservados no merge do PUT.
- **Why:** É o que o atendente entende por "vencimento"; evita expor conceitos internos do SeuFisio (renovação, encerramento) que a skill teria de explicar.
- **Rejected:** Cobrança + encerramento (a captura mexeu nos dois, mas encerramento não é pedido do negócio); os três campos (complexidade sem demanda).
- **Links:** 01-investigation.md › Decisions › Business item 2; `reqs/editar-plano-cliente.har`
- **Terms:** vencimento = `dia_padrao_cobranca` (dia do mês em que a cobrança mensal do plano é gerada) → CONTEXT.md

## D-03 · business

- **Question:** Ao trocar o serviço ou a periodicidade, o preço é recalculado ou o `valor_congelado` é mantido? Desconto é editável?
- **Decision:** Se o atendente informar `valor_mensal`, ele vira o novo `valor_congelado`. Se não informar e o serviço (`tipo_atendimento_id`) mudou, recalcular por `resolvePrice()`. Se nada disso mudou, manter o congelado atual. `percentual_desconto` é editável pela skill.
- **Why:** Cobre negociação caso a caso sem deixar o preço antigo ao trocar de serviço.
- **Rejected:** Recalcular sempre (impede negociação); nunca recalcular (subcobrança ao trocar de "2x" para "3x").
- **Links:** 01-investigation.md › Decisions › Business item 3; `src/services/recurring-plans.ts:122`
- **Terms:** —

## D-04 · business

- **Question:** Slot `lotado` no novo dia/horário: prosseguir sinalizando ou bloquear a edição?
- **Decision:** Igual à criação: a edição prossegue e cada dia na resposta traz `lotado: true/false`; a skill avisa o atendente.
- **Why:** Paridade com o POST /api/plans; a lotação é resolvida pela operação da turma, não pela API.
- **Rejected:** Bloquear com 400 (rigidez sem demanda); flag `forcar_lotado` (caminho a mais para a skill).
- **Links:** 01-investigation.md › Decisions › Business item 4; `src/services/slot-assignment.ts:24`
- **Terms:** —

## D-05 · business

- **Question:** A edição deve disparar mensagem WhatsApp ao cliente?
- **Decision:** Nada automático. A resposta do PUT devolve `horarios` (texto de `scheduleText()`) e a skill decide se avisa o cliente.
- **Why:** Mantém a rota sem dependência de Evolution/Supabase; mensageria fica com a skill.
- **Rejected:** Envio automático (503 quando WhatsApp não configurado, cópia nova); flag `notificar` (mistura edição e mensageria).
- **Links:** 01-investigation.md › Decisions › Business item 5; `src/services/recurring-plans.ts` (`scheduleText`)
- **Terms:** —

## D-06 · technical

- **Question:** Fonte do limite semanal e fallback quando o nome do serviço não casa.
- **Decision:** Regex `/(\d+)x\s*na\s*semana/i` sobre `tipo_atendimento.nome`. Sem match → não validar o limite, prosseguir, e a resposta traz `limite_semanal: null` com um aviso textual.
- **Why:** É a única fonte disponível (`total_atendimentos_semanais_ciclo` vem null); serviços fora do padrão não devem travar a edição.
- **Rejected:** 400 sem match (trava serviços legítimos); tabela de override (manutenção sem demanda).
- **Links:** 01-investigation.md › Decisions › Technical open item 1; `docs/attendance-types.md:180,240,300`; D-01
- **Terms:** limite semanal → CONTEXT.md

## D-07 · technical

- **Question:** Forma da resposta de leitura/escrita do plano para a skill.
- **Decision:** Normalizada, espelhando o 201 do POST /api/plans, mais `percentual_desconto`, `dia_vencimento`, `limite_semanal`, `horarios`; `raw` com o `cliente-servico` bruto só com `?raw=1`.
- **Why:** Paridade com o que a skill já consome; `raw` cobre depuração sem novo deploy.
- **Rejected:** Sem `raw`; objeto bruto do SeuFisio.
- **Links:** docs/adr/0001-contrato-plano-recorrente-normalizado.md; 01-investigation.md › Decisions › Technical open item 2; `src/routes/plans.ts:60`; AD-04
- **Terms:** —

## D-08 · technical

- **Question:** Repassar o status HTTP upstream (4xx) ou forçar 500 como AD-03?
- **Decision:** Manter o corpo `{ error, details }` e repassar o status quando o SeuFisio responder 4xx; 5xx/rede viram 500. Validação local segue 400.
- **Why:** A skill distingue erro do atendente de erro do sistema pelo status, sem parsear `details`.
- **Rejected:** Sempre 500 (AD-03 original); tudo 400 `{ problemas[] }`.
- **Links:** docs/adr/0002-repasse-status-4xx-upstream.md; AD-03 (overridden → D-08); `src/services/charges.ts:139-144`
- **Terms:** —

## Deferred

- (nenhum)
