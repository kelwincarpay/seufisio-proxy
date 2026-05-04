## Auth API

```CURL
curl 'https://api.seufisio.com.br/api/pacote/17' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'acesso: web-desktop' \
  -H 'authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiMmZiN2I4ODY3MDUxYWQzY2ZhMzQ4MDc2YTgxYzg0MzQzODFjOTU3NzA5ZmIyYjc0MWFjOTQ3ODJiNTg1ZTU0YTlhMDY3Nzg5NWMxMjc1ZjQiLCJpYXQiOjE3NzUwNDI1MTkuMzc3MjgsIm5iZiI6MTc3NTA0MjUxOS4zNzcyODIsImV4cCI6MTc3NTIxODkxOS4zNjI5ODcsInN1YiI6IjIxNzE0Iiwic2NvcGVzIjpbXX0.M6mSK-81Xv03g_Qc55ZETAV0pAwkmMb-LBte1_do634G2Hq1OE2001_Y3eagFMMKzP-KwUr21wRntBi7uzqYLwn9b5lDsOEXMAAlfb7WYaYeWJ1t9OB-eg3NB0N7qWfkPpPzzW3fhI93P06hmq2og42PUoo5_Nv5yaA1DU82sFFPx5xdlY39Achv5CFpjApehYynwwC3f-gY1VRQc9ycevge5hdBrRl_QuGfvwHoaH9G376hethuZR_41kMa1nYKzr6RQCunPVXD7jxE6QhanWpHoBH5ExtIrGUkj-DdplI0Hh1KxQtkGFqSXe2XVxrbxeDUo4GfhFtdTNu-Ugqk1DiOcnUE4jYwJu8sw3NPeYgNUX6Zupf9zjhR7VxN3VpAyBWN4_yMF_fyRRayRFyiwvcVyQeq-iNl7FhKexvI_3G4eEoHMshWT72ISc9BKrx7UIpp0Q9IRT_J7M81VM_SsPK7sw1TUbv-S7e9bmRaM97FKxfm6MGX_ve0U0G2_uSbJ7svfmrtvFumIBa6uJyCCgXqnARTVfwWaqQZaB3ByXFrPMM-9afVD6yjuoIq-vIGSAEAepQ1TSq9nrwr5IrEC9H7ioxAmk-a-u5vbDPxOPAqWUMRiN9VLnR2gi0bwQQibtIXhk3dbdxc_5HDIWkJ-JBaEv8BuYIMLG38xKD8epE' \
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
  -H 'x-version-app: 26'
```

## Response

```JSON
{
    "id": 17,
    "cliente_id": 210,
    "plano_venda_id": null,
    "qtd_atendimentos": 100,
    "valor": 0,
    "pago": 0,
    "forma_pagamento_id": 7,
    "created_at": "2026-02-23T12:09:10.000000Z",
    "updated_at": "2026-02-23T12:09:10.000000Z",
    "created_by_user_id": 21714,
    "inf_renovacao": {
        "qtd_atendimentos": 100,
        "tipo_atendimento_id": 13,
        "convenio_id": null,
        "nome_exibicao": null,
        "agendamento_app_checkin": false,
        "domingo": false,
        "segunda": false,
        "terca": false,
        "quarta": false,
        "quinta": {
            "hora": "12:00",
            "profissional_id": 1,
            "sala_id": 1
        },
        "sexta": false,
        "sabado": false
    },
    "dias_fixos": true,
    "data_inicial": "2026-02-26",
    "qtd_atendimentos_contratados": 100,
    "tipo_parcelamento": 1,
    "nome_exibicao": null,
    "agendamento_app_checkin": false,
    "profissional_preferencia_id": null,
    "data_maxima_agendamento": "2028-01-20",
    "cartao_credito_id": null,
    "cobranca_automatica": false,
    "permitir_justificar_ausencia_app_checkin": true,
    "permitir_reposicoes_apos_termino": true,
    "proximo_pacote_id": null,
    "atendimentos_quinzenais": false,
    "quantidade_reposicoes": null,
    "ignorar_quantidade_reposicoes": true,
    "qtd_aulas_feitas": 5,
    "cliente_nome": "Anderson manuel Souza mendon\u00e7a",
    "contrato": null
}
```

