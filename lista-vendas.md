## Auth API

```CURL
curl 'https://api.seufisio.com.br/api/cliente/216/listar-vendas?tab=ativas&page=1&per_page=6' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: pt-BR,pt;q=0.9' \
  -H 'acesso: web-desktop' \
  -H 'authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiMjgwZTViZTBlZjJkYmZiYzcxZGMwZjZmYzk5OTFmNDA3NDYyYjNmNDc5MjM4OWYzYjJlMzBhYzY4Mzk3M2IwMjU4ZjFkOTBkODUwMmRlYWIiLCJpYXQiOjE3NzE5NzYzNTguNTM3NTM1LCJuYmYiOjE3NzE5NzYzNTguNTM3NTM3LCJleHAiOjE3NzIxNTI3NTguNTIzNjc4LCJzdWIiOiIyMTcxNCIsInNjb3BlcyI6W119.cUY8Ceg7zFBMIoHyviWnMFbEwd5Lh1KguvaNAHiyerk3_q5BwyOsN9kIHZUIToENDFKR69niKwdJEhjaziJwfyJHW57MrivQsb9ts5LP6-TQ-r6_hQIal7gfMkRFSoSthKFQyCWvUhjcF6EyKREwJ6nAktMACEyjyrXVvdj7Xqzbr8kTl3XarvkE2pGN69NWIe1KTPASqNLSfAwbZdKyJS8qf3PYk3PCi_SIMq9Qg41QZHQq2ZUt8QIH4GejS-m7iBIfXV7gjhEgiMKSH6Uu77TvATVXTkEvsjBBXVyQgkAqD2B4ON6O_pVZ88LoB6GU-pCXi7aWIzJroEfkzS3YBN3aGov-lpYZZC8V1gHO5cS_m8zOWry2uHXb5Co5CF7Z0fKjnxztQknR042T8sc2dN6kYQ8IG4aMo9hlmftkWRIrk1ir24CxuKe1RxOXRywIxY78E84EP0Uqnk_QX4l9R_omjuDuXh7ZYoE0bFu_92y1kS3FxRUK5AeMwi7RGzTjFX70co_I9BybHApXwnEPXRtEpknlp-yI9xoP3xvjReCWf5b5u2HJHKbpz0hPFwldrvEwxqoa52VEG6I0r_-PDLRzmEu3BxxKk-JYMjn09YTYNdoAn38lwZ9OV6I0vqc5ggnvpegVuqRTfJYkKr0RGNHi_BXB5HzoSnJWgEvcC3Q' \
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
{
    "data": [
        {
            "id": 15,
            "cicloId": null,
            "tipoVenda": "pacote_personalizado",
            "tipoAtendimentoNome": "Aula Avulsa",
            "dataInicial": "2026-02-18",
            "validade": "2027-02-17",
            "atendimentosFeitos": 2,
            "atendimentosContratados": 105,
            "atendimentosRepor": 1,
            "valor": 0,
            "notaFiscalAutomatica": false,
            "cobrancaAutomatica": false,
            "informacoes": [
                "Quarta \u00e0s 11:00, com Priscila S. na sala Sala 01",
                "Sexta \u00e0s 13:00, com Andressa G. na sala Sala 01"
            ],
            "tipoAtendimentoId": 12,
            "periodicidade": null,
            "periodicidadeLabel": null,
            "dataPause": null
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 6,
        "total": 1,
        "last_page": 1
    }
}
```
