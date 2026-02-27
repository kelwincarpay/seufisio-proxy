## Auth API

```CURL
curl 'https://api.seufisio.com.br/api/slots/calendario?data_inicial=2026-02-23T00:00:00&data_final=2026-02-28T00:00:00&profissional_id=1' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'acesso: web-desktop' \
  -H 'authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiZGJjNTM3Y2NiZDZlZWU1NzkwZGUzY2NlZTkyZDQyNzgzOGFlZjlkMDFjY2Q3ZjI4ZTgwMmI2NzY2MzdjYmYyY2UxY2RjMjk3YmNkYzA5MmYiLCJpYXQiOjE3NzIyMDA2MjMuNzA5Nzg5LCJuYmYiOjE3NzIyMDA2MjMuNzA5NzkyLCJleHAiOjE3NzIzNzcwMjMuNjk2MTcxLCJzdWIiOiIyMTcxNCIsInNjb3BlcyI6W119.sarkxbZ4dwQWZ2ZZNBP5h9LT_pRM9HlsAT9_1l3UN056eqrA_ebKXwgVmx4wN0SlNHhKOV4xTIw6wIazYlV0Ds3moI779YNMYOu89ShFmQTJtO5esKL40Oi2xTCwh9dZVKlW0QmS-1Wu7HVeCpNikecyHfdDJm2YrDoOSK2aKU43skscbFaNynvGF2U6hqiQVGlo86-MH_DhXyKAqzGGNnKjD3hspCQwFuDXK9ZETqBIweAzrnbE4I9rdqs5gw7C7KoThBvZS5Ev6wM3KZIKRXmXeAhJIHKqjVokcI0R7sLbxbXDqXrWgKJhuTVbc2L-dCrRu5gJV0aXyECwhhZElwAQAbhVLCu-OL9ae0LrTjcDqacuHmnkQcr0pxLhlb6V-2RmTN1ofGqUsdDZbC9wo2ssS7URUF9dq9uxH4W9aNZr0N3O2KsStv34N3Pyom2Fb7PZAH0ooT9BttVjFREAOLI_s9S8eytK48SzLASKlJw9005xRh32yuAVMtpatVMNZ5EY_ojfPW3mHY3X9u9JwG8pXhYJget9IxR30tfo0B7xlVEHkWxAerblmE0NU8pA7CelOiTW1O59J2l8oLEuPSR6A2NfuvnCV5nvFlEq8JoeL19_oD69OQO5iiJ-7LyBaDTWxLERdwCoGALATg3UuBN-w0dDJTn_SpJzovJdPco' \
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
  -H 'x-version-app: 24'
```

## Response

```JSON
[
    {
        "id": 1316,
        "grupo_id": 1,
        "total_capacity": 3,
        "total_booked": 3,
        "total_overbooked": 0,
        "occur_date": "2026-02-27",
        "start_time": "20:00:00",
        "end_time": "20:50:00"
    },
    {
        "id": 1315,
        "grupo_id": 1,
        "total_capacity": 4,
        "total_booked": 4,
        "total_overbooked": 0,
        "occur_date": "2026-02-27",
        "start_time": "19:00:00",
        "end_time": "19:50:00"
    },
    {
        "id": 1314,
        "grupo_id": 1,
        "total_capacity": 4,
        "total_booked": 4,
        "total_overbooked": 0,
        "occur_date": "2026-02-27",
        "start_time": "18:00:00",
        "end_time": "18:50:00"
    },
    {
        "id": 1313,
        "grupo_id": 1,
        "total_capacity": 4,
        "total_booked": 3,
        "total_overbooked": 0,
        "occur_date": "2026-02-27",
        "start_time": "17:00:00",
        "end_time": "17:50:00"
    },
    {
        "id": 1312,
        "grupo_id": 1,
        "total_capacity": 1,
        "total_booked": 1,
        "total_overbooked": 0,
        "occur_date": "2026-02-27",
        "start_time": "16:00:00",
        "end_time": "16:50:00"
    },
    {
        "id": 1311,
        "grupo_id": 1,
        "total_capacity": 4,
        "total_booked": 2,
        "total_overbooked": 0,
        "occur_date": "2026-02-27",
        "start_time": "15:00:00",
        "end_time": "15:50:00"
    }
]
```
