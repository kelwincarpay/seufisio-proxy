# ADR-0002 · Repasse do status HTTP 4xx do SeuFisio nas rotas de edição

- **Status:** accepted · 2026-09-07
- **Feature:** 001-editar-plano-recorrente (D-08; substitui parcialmente AD-03)

## Contexto
Os routers atuais devolvem 500 `{ error, details }` para qualquer falha upstream. A skill precisa
distinguir "dado do atendente inválido" de "sistema fora" para orientar o usuário.

## Decisão
Nas rotas de leitura/edição do plano recorrente:
- upstream 4xx (400/409/422/404) → mesmo status, corpo `{ error, details: upstream.data }`;
- upstream 5xx, timeout ou falha de rede → 500 `{ error, details: message }`;
- validação local continua 400 `{ error }` ou `{ error, problemas[] }` (AD-06, AD-03).

## Consequências
- O formato do corpo não muda; só o status ganha semântica. Routers existentes não são alterados nesta feature.
- Precedente: `src/services/charges.ts:139-144`.

## Rejeitadas
- Sempre 500 (skill teria de inspecionar `details`).
- Tudo 400 `{ problemas[] }` (perde 409/422).
