## Auth API

```CURL
curl 'https://api.seufisio.com.br/api/basic-events?start=1771815600&end=1772420399&profissional_id=2' \
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
[
    {
        "title": "Julyane Jadlis ",
        "start": "2026-02-23 09:00:00",
        "end": "2026-02-23 09:50:00",
        "content": "Totalpass"
    },
    {
        "title": "Rosangela Garci",
        "start": "2026-02-23 10:00:00",
        "end": "2026-02-23 10:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Andressa Fernan",
        "start": "2026-02-24 16:00:00",
        "end": "2026-02-24 16:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Brenda Ferreira",
        "start": "2026-02-24 15:00:00",
        "end": "2026-02-24 15:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Ligia Maria Men",
        "start": "2026-02-24 18:00:00",
        "end": "2026-02-24 18:50:00",
        "content": "Totalpass"
    },
    {
        "title": "Aline Cristina ",
        "start": "2026-02-24 19:00:00",
        "end": "2026-02-24 19:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Hugo Fernandes ",
        "start": "2026-02-24 19:00:00",
        "end": "2026-02-24 19:50:00",
        "content": "Pilates 3x na Semana"
    },
    {
        "title": "Carla Viera Bov",
        "start": "2026-02-24 20:00:00",
        "end": "2026-02-24 20:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Marco Aur\u00e9lio R",
        "start": "2026-02-24 19:00:00",
        "end": "2026-02-24 19:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Yasmim da Silva",
        "start": "2026-02-24 19:00:00",
        "end": "2026-02-24 19:50:00",
        "content": "Sess\u00e3o Avalia\u00e7\u00e3o"
    },
    {
        "title": "Gleice Kelly Pi",
        "start": "2026-02-24 20:00:00",
        "end": "2026-02-24 20:50:00",
        "content": "Aula Avulsa"
    },
    {
        "title": "Valdir Aparecid",
        "start": "2026-02-25 20:00:00",
        "end": "2026-02-25 20:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Maria Benvinda ",
        "start": "2026-02-25 20:00:00",
        "end": "2026-02-25 20:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Madalena Ferrei",
        "start": "2026-02-25 20:00:00",
        "end": "2026-02-25 20:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Hugo Fernandes ",
        "start": "2026-02-25 19:00:00",
        "end": "2026-02-25 19:50:00",
        "content": "Pilates 3x na Semana"
    },
    {
        "title": "Carla Cristina ",
        "start": "2026-02-25 17:00:00",
        "end": "2026-02-25 17:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Patr\u00edcia Hedjaz",
        "start": "2026-02-25 17:00:00",
        "end": "2026-02-25 17:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Solange Aurelio",
        "start": "2026-02-25 18:00:00",
        "end": "2026-02-25 18:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Isabella Alves ",
        "start": "2026-02-25 19:00:00",
        "end": "2026-02-25 19:50:00",
        "content": "Totalpass"
    },
    {
        "title": "Priscila Gracie",
        "start": "2026-02-25 19:00:00",
        "end": "2026-02-25 19:50:00",
        "content": "Totalpass"
    },
    {
        "title": "Juliana Zanardi",
        "start": "2026-02-25 18:00:00",
        "end": "2026-02-25 18:50:00",
        "content": "Totalpass"
    },
    {
        "title": "Bianca De C\u00e1ssi",
        "start": "2026-02-25 19:00:00",
        "end": "2026-02-25 19:50:00",
        "content": "Aula Avulsa"
    },
    {
        "title": "Liliane Soares ",
        "start": "2026-02-25 20:00:00",
        "end": "2026-02-25 20:50:00",
        "content": "Aula Avulsa"
    },
    {
        "title": "Beatriz Fernand",
        "start": "2026-02-26 19:00:00",
        "end": "2026-02-26 19:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Carla Viera Bov",
        "start": "2026-02-26 20:00:00",
        "end": "2026-02-26 20:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Marco Aur\u00e9lio R",
        "start": "2026-02-26 20:00:00",
        "end": "2026-02-26 20:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Ellen Cristine ",
        "start": "2026-02-26 16:00:00",
        "end": "2026-02-26 16:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Mariana Brandem",
        "start": "2026-02-26 18:00:00",
        "end": "2026-02-26 18:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Paulo Rog\u00e9rio F",
        "start": "2026-02-26 20:00:00",
        "end": "2026-02-26 20:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Simone Franco d",
        "start": "2026-02-26 20:00:00",
        "end": "2026-02-26 20:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Julia Tamires B",
        "start": "2026-02-26 19:00:00",
        "end": "2026-02-26 19:50:00",
        "content": "Aula Avulsa"
    },
    {
        "title": "Brenda Ferreira",
        "start": "2026-02-26 16:00:00",
        "end": "2026-02-26 16:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Yasmin Pereira ",
        "start": "2026-02-27 08:00:00",
        "end": "2026-02-27 08:50:00",
        "content": "Pilates 1x na Semana"
    },
    {
        "title": "Auciline goncal",
        "start": "2026-02-27 10:00:00",
        "end": "2026-02-27 10:50:00",
        "content": "Pilates 2x na Semana"
    },
    {
        "title": "Priscila Gracie",
        "start": "2026-02-27 13:00:00",
        "end": "2026-02-27 13:50:00",
        "content": "Totalpass"
    },
    {
        "title": "Kelwin Sanches ",
        "start": "2026-02-27 13:00:00",
        "end": "2026-02-27 13:50:00",
        "content": "Aula Avulsa"
    },
    {
        "title": "Romildo de Oliv",
        "start": "2026-02-27 10:00:00",
        "end": "2026-02-27 10:50:00",
        "content": "Aula Avulsa"
    },
    {
        "title": "Joelma Silene D",
        "start": "2026-02-27 10:00:00",
        "end": "2026-02-27 10:50:00",
        "content": "Aula Avulsa"
    },
    {
        "title": "Giovana Tamara ",
        "start": "2026-02-27 09:00:00",
        "end": "2026-02-27 09:50:00",
        "content": "Sess\u00e3o Avalia\u00e7\u00e3o"
    }
]
```
