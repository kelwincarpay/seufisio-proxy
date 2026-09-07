# 001-editar-plano-recorrente · Auto decisions

Taken by `/kss-investigate` without asking. Review them with
`/kss-review-decisions 001-editar-plano-recorrente`. Nothing here is ever deleted.

## AD-01 · technical · settled

- **Decision:** A edição é um PUT de objeto completo em `/api/cliente-servico/:id`: GET → aplicar mudanças → PUT → re-GET para devolver o estado final.
- **Alternatives:** PATCH parcial (não existe upstream); enviar só campos alterados (o app web ecoa tudo).
- **Evidence:** `reqs/editar-plano-cliente.har` — o único write é `PUT /api/cliente-servico/125` com todas as chaves do GET; `src/services/charges.ts` — precedente de PUT completo no proxy.
- **Confidence:** high
- **Status:** auto · reviewed: no

## AD-02 · technical · settled

- **Decision:** Profissional e sala de cada dia/hora resolvidos por `assignProfessionals()` (grade via `/api/slots/calendario`), com âncora na data efetiva da edição; `profissional_id` informado pelo chamador continua vencendo.
- **Alternatives:** exigir `profissional_id` da skill; escrever um resolvedor novo.
- **Evidence:** `src/services/slot-assignment.ts:87-171` — único resolvedor existente, já opera em dia da semana + hora; `src/routes/plans.ts:136` — uso na criação.
- **Confidence:** high
- **Status:** auto · reviewed: no

## AD-03 · technical · overridden

- **Decision:** Erros seguem `{ error: string, details: upstream.data || message }`; falhas de slot seguem 400 `{ error, problemas[] }` da criação.
- **Alternatives:** classe de erro/interceptor compartilhado (não existe hoje).
- **Evidence:** `src/routes/plans.ts:282,344,411,516`, `customers.ts:161`, `charges.ts:90`, `onboarding.ts:48` — mesma forma em 5 de 5 routers que escrevem upstream.
- **Confidence:** high
- **Status:** overridden → D-08 (formato `{ error, details }` mantido; status HTTP 4xx do upstream passa a ser repassado em vez de 500) · reviewed: no

## AD-04 · technical · default

- **Decision:** Novos endpoints ficam em `src/routes/plans.ts` sob `/api/plans/recurring/:planId` (GET detalhado + PUT).
- **Alternatives:** router novo `recurring-plans.ts`; endpoint sob `/api/clients/:id/plans`.
- **Evidence:** `src/routes/plans.ts:299` — `GET /recurring/:planId` já existe ali; CLAUDE.md: um router por domínio.
- **Confidence:** medium
- **Status:** auto · reviewed: no

## AD-05 · technical · settled

- **Decision:** A edição não escreve no Supabase.
- **Alternatives:** atualizar `client_onboarding`/`notification_log`.
- **Evidence:** `supabase/onboarding.sql:10-32` — nenhuma coluna de dia/hora/vencimento/profissional; `src/services/reminder-cron.ts:148` — agenda lida ao vivo do SeuFisio.
- **Confidence:** high
- **Status:** auto · reviewed: no

## AD-06 · technical · default

- **Decision:** Validação de entrada manual no estilo `validatePlan()`, respondendo 400 `{ error }`.
- **Alternatives:** zod/joi.
- **Evidence:** `src/routes/plans.ts` (`validatePlan`), `src/routes/charges.ts:99` — nenhuma rota usa lib de schema.
- **Confidence:** high
- **Status:** auto · reviewed: no

## AD-07 · technical · settled

- **Decision:** Campos fixos e formatos de data reutilizam `buildPlanPayload()`/`endMonth()` (`data_encerramento` em MM/YYYY na escrita, `dia_padrao_*` como dia do mês).
- **Alternatives:** montar payload novo do zero.
- **Evidence:** `src/services/recurring-plans.ts:205`; `docs/criar-plano-recorrente.md:~175`; diff GET→PUT no HAR confirma MM/YYYY.
- **Confidence:** high
- **Status:** auto · reviewed: no

## AD-08 · technical · settled

- **Decision:** O builder do payload de edição é fixado em `scripts/check-payloads.ts` contra o HAR; o HAR é convertido em `docs/editar-plano-recorrente.md` com `npm run har`.
- **Alternatives:** criar suíte de testes (não existe no repo).
- **Evidence:** `scripts/check-payloads.ts:1-16`; `docs/como-capturar-requests.md:22-38`.
- **Confidence:** high
- **Status:** auto · reviewed: no

## AD-09 · technical · settled

- **Decision:** O MD para a skill segue a estrutura de `docs/api-specs.md` (seção por endpoint, request/response, Error Reference), conteúdo em pt-BR.
- **Alternatives:** formato `_template.md` (é para specs upstream, não para endpoints do proxy).
- **Evidence:** `docs/api-specs.md` — único doc de endpoints do proxy; `.kss/config.md` `docs_language: pt-BR`.
- **Confidence:** medium
- **Status:** auto · reviewed: no
