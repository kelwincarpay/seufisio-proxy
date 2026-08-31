# Trocar status de um atendimento

Endpoint dedicado que o app web usa para mudar o status na agenda (ex.: marcar
"Não Compareceu"). O `PUT /api/atendimento/{id}` com o objeto completo **não**
serve para isso: responde `204 No Content` e mantém o status antigo
silenciosamente.

```CURL
curl 'https://api.seufisio.com.br/api/atendimento/status/12537' \
  -X 'PATCH' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Authorization: Bearer <token>' \
  -H 'Origin: https://app.seufisio.com.br' \
  -H 'Referer: https://app.seufisio.com.br/' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'acesso: web-desktop' \
  -H 'x-version-app: 34' \
  -H 'SetFisio: 9208' \
  --data-raw '{"status_id":5}'
```

- Corpo: apenas `{"status_id": <id>}`.
- Status usados pelo estúdio: `5` = Não Compareceu (cancelamento), `6` =
  Ausência Justificada, `4` = concluído. Lista completa em
  `docs/list-status-atendimentos.md`.
- Capturado do app web em 2026-08-31 (agenda → mudar status do atendimento).
