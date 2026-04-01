## Auth API

```CURL
curl 'https://api.seufisio.com.br/api/pacote/{idPacote}/atualizar-horarios' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'acesso: web-desktop' \
  -H 'authorization: Bearer {token}' \
  -H 'content-type: application/json' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'priority: u=1, i' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'sec-ch-ua: "Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'setfisio: 9208' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 26' \
  --data-raw '{"data_inicio_alteracao":"2026-04-01","domingo":false,"segunda":false,"terca":false,"quarta":true,"quinta":false,"sexta":true,"sabado":false,"sala_id_domingo":null,"sala_id_segunda":null,"sala_id_terca":null,"sala_id_quarta":1,"sala_id_quinta":null,"sala_id_sexta":1,"sala_id_sabado":null,"profissional_id_domingo":null,"profissional_id_segunda":null,"profissional_id_terca":null,"profissional_id_quarta":1,"profissional_id_quinta":null,"profissional_id_sexta":2,"profissional_id_sabado":null,"hora_domingo":"","hora_segunda":"","hora_terca":"","hora_quarta":"10:00","hora_quinta":"","hora_sexta":"13:00","hora_sabado":""}'
```

## Response

```JSON

```
