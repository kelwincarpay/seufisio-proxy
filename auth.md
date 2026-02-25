## Request

```CURL
curl 'https://api.seufisio.com.br/oauth/token' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: pt-BR,pt;q=0.9' \
  -H 'acesso: web-desktop' \
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
  -H 'setfisio;' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 24' \
  --data-raw '{"username":"fisiopriscilasavoia@gmail.com","password":"Deuteronomio28","grant_type":"password","client_id":2,"client_secret":"OQI3t4amUsJyN4RgLyyy9ablTwX647gty5jvBZKA"}'
```

## Response

```JSON
{
    "token_type": "Bearer",
    "expires_in": 176400,
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiMjgwZTViZTBlZjJkYmZiYzcxZGMwZjZmYzk5OTFmNDA3NDYyYjNmNDc5MjM4OWYzYjJlMzBhYzY4Mzk3M2IwMjU4ZjFkOTBkODUwMmRlYWIiLCJpYXQiOjE3NzE5NzYzNTguNTM3NTM1LCJuYmYiOjE3NzE5NzYzNTguNTM3NTM3LCJleHAiOjE3NzIxNTI3NTguNTIzNjc4LCJzdWIiOiIyMTcxNCIsInNjb3BlcyI6W119.cUY8Ceg7zFBMIoHyviWnMFbEwd5Lh1KguvaNAHiyerk3_q5BwyOsN9kIHZUIToENDFKR69niKwdJEhjaziJwfyJHW57MrivQsb9ts5LP6-TQ-r6_hQIal7gfMkRFSoSthKFQyCWvUhjcF6EyKREwJ6nAktMACEyjyrXVvdj7Xqzbr8kTl3XarvkE2pGN69NWIe1KTPASqNLSfAwbZdKyJS8qf3PYk3PCi_SIMq9Qg41QZHQq2ZUt8QIH4GejS-m7iBIfXV7gjhEgiMKSH6Uu77TvATVXTkEvsjBBXVyQgkAqD2B4ON6O_pVZ88LoB6GU-pCXi7aWIzJroEfkzS3YBN3aGov-lpYZZC8V1gHO5cS_m8zOWry2uHXb5Co5CF7Z0fKjnxztQknR042T8sc2dN6kYQ8IG4aMo9hlmftkWRIrk1ir24CxuKe1RxOXRywIxY78E84EP0Uqnk_QX4l9R_omjuDuXh7ZYoE0bFu_92y1kS3FxRUK5AeMwi7RGzTjFX70co_I9BybHApXwnEPXRtEpknlp-yI9xoP3xvjReCWf5b5u2HJHKbpz0hPFwldrvEwxqoa52VEG6I0r_-PDLRzmEu3BxxKk-JYMjn09YTYNdoAn38lwZ9OV6I0vqc5ggnvpegVuqRTfJYkKr0RGNHi_BXB5HzoSnJWgEvcC3Q",
    "refresh_token": "def502004b879a21bffbe6bf4a3ffe2e8f0bd4d7054e751a8504de6b0e12807eba7aecee55cc4a9d5f10ee0d574af981090836f72165a04597441f172f661c93028bc312e49299f89ba0cb75e128862666ed06b4ec6d71b82386b70221a177f050e5519b5ca6efa687e8d6033571abd706a1850e3abaa4e468a4f814fc234a214d53caac2617d0d0627299055811e44e4a22abc8541a615f87af942f275a896566c2f8c8ced7b30ce5fe65d6f0daf738eccaf4973d303cab8fef7a4f6b8b24660c6f5f91a009afbfea3cb1d3299a6577294006dbd643526e1d168363fb6a9630d8a2982fd34f2a7d4470126aa36b1c70c1563b8690c088acbc27f4f5824d7664b8c30d5bf8205971494589e3f884783b351610b1b212d55947ee67bad63cd2c00306ad960138aa5f1d613eb86b6df55f5ff63f2c203bb5e2bb92e6d45d6ccabaaab6885460ac54123162da6519bfc4924f2aea0d5490b5876fa25fa846da55602b8c3f824baef4"
}
```
