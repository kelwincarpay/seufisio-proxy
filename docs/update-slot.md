## Update Slot Capacity API

```CURL
curl 'https://api.seufisio.com.br/api/grupo/{GroupId}/slot/{SlotId}/atualizar-capacidade' \
  -X 'PUT' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'acesso: web-desktop' \
  -H 'authorization: Bearer {Token}' \
  -H 'content-type: application/json' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'priority: u=1, i' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'setfisio: 9208' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 24' \
  --data-raw '{"totalCapacity":4,"totalBooked":null}'
```

## Response

```JSON
{
    "id": 1316,
    "turmaId": 30,
    "grupoId": 1,
    "tipoAtendimentoId": 12,
    "profissionalId": 1,
    "salaId": 1,
    "remoteClassId": 5199031,
    "remoteSlotId": 197191286,
    "totalCapacity": 4,
    "durationInMinutes": 50,
    "totalBooked": 3,
    "totalOverbooked": 0,
    "occurDate": "2026-02-27",
    "startTime": "20:00:00",
    "createdAt": "2026-02-06 04:34:24",
    "updatedAt": "2026-02-26 12:00:56",
    "totalPassEventId": "ca9c97f9-e911-414b-9fe8-72a5600d5ae3"
}
```
