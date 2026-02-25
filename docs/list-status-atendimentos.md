## Auth API

```CURL
curl 'https://api.seufisio.com.br/api/status?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'acesso: web-desktop' \
  -H 'authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiZTNkYzUxZWU0OWRlMGY1M2RmMjQyMzE3NzVkMDNhY2NlZmE0NjY4YTY5ZTBkOWE2MmY2YWY2OTY4NTYwNTkzMmQ4OWI1ZTEyMTVlZWMzY2QiLCJpYXQiOjE3NzE5NzQ2MzYuNjU0NDY5LCJuYmYiOjE3NzE5NzQ2MzYuNjU0NDcyLCJleHAiOjE3NzIxNTEwMzYuNjQwODAzLCJzdWIiOiIyMTcxNCIsInNjb3BlcyI6W119.MI1nnTIslx13b7savaUAr8R27iLEhid0IVwT-qFQmx1hU3ookexdGhYgAEZEYXBdK2Jrjb70GakUQOEXkW8iOQm25Z4MMMBQ0bMlgFHCXxbmTgl4rWLfG1fyKUTYYeL69-n5GGHxThGDEvTy7NsUQ6MnjDnJL9nEgkLp_jSyfTENW9YVfAUWkq1OWUCbib599JE-OxmkVitafJfk1sOTeB1yv0vmUx_BInqfZwokSsi9IrSYV5KiOENV3oclp3I80cHjD3ZEV0rKd5wNexxbR2oOhIA4ZnX6_3-0SZmyM9DerTXiJgmeUTaRTCsBAVvEUyRFOAtw5Prx5LZx-o8XcPKEZG4sjxeur6YaQFm-T2efgj1BlByp1cA127qZ5h6qKG9PCgGY26dBa4WPfs0swVUAbqEHXID5Fa2-rfqeSXROjIhw6dpmU_4jXR4bPuvbDtusjB98yIj53vbgzpKaR4tWNZh9jeoMmPzytRdRGCGLEOVugu-W8JGcrzhCK9gd664i8Pn8FzKQqW3K3lCWulqQwaFZZh9skv6-SpNJgyK22TPihV1BMqyVSjSs0VrYAV4Npqh_b-BSnilu8pFMzNP92p3-C1UC7fB4GbFaH_LSqu28K075J_GprH0V3h--8dTIP6Z3XIu4rlOMseqbzf1euDqljN7kcvqusot4WPQ' \
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
        "id": 1,
        "nome": "Aguardando Chegar",
        "abreviacao": "AC",
        "color": "#64b5f6",
        "class": "blue",
        "ativo": true
    },
    {
        "id": 4,
        "nome": "Finalizado",
        "abreviacao": "FI",
        "color": "#81c784",
        "class": "green",
        "ativo": true
    },
    {
        "id": 5,
        "nome": "N\u00e3o Compareceu",
        "abreviacao": "NC",
        "color": "#e57373",
        "class": "red",
        "ativo": true
    },
    {
        "id": 6,
        "nome": "Aus\u00eancia Justificada",
        "abreviacao": "AJ",
        "color": "#ba68c8",
        "class": "purple",
        "ativo": true
    },
    {
        "id": 7,
        "nome": "Aus\u00eancia do Profissional",
        "abreviacao": "AP",
        "color": "#ffb74d",
        "class": "orange",
        "ativo": true
    },
    {
        "id": 8,
        "nome": "Aus\u00eancia Nula",
        "abreviacao": "AN",
        "color": "#7986cb",
        "class": "indigo",
        "ativo": false
    },
    {
        "id": 2,
        "nome": "Em Espera",
        "abreviacao": "EE",
        "color": "#000000",
        "class": "black",
        "ativo": false
    },
    {
        "id": 3,
        "nome": "Em Atendimento",
        "abreviacao": "EA",
        "color": "#000000",
        "class": "black",
        "ativo": false
    },
    {
        "id": 9,
        "nome": "Pausado",
        "abreviacao": "PS",
        "color": "#000000",
        "class": "black",
        "ativo": false
    }
]
```
