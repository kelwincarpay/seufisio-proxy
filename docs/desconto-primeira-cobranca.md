# Desconto na cobrança (ex.: crédito da sessão de avaliação)

Caso de uso: o cliente já pagou algo antes de fechar o plano (R$ 50 da Sessão Avaliação,
por exemplo). Esse valor entra como desconto na **primeira cobrança gerada pelo plano**.

Capturado de `app.seufisio.com.br-fatura-contrato.har` (conta 827, R$ 200 → R$ 150).

## 1. Achar a cobrança do plano

A criação do plano gera a cobrança do primeiro ciclo automaticamente. Para localizá-la:

```CURL
curl 'https://api.seufisio.com.br/api/conta-receber?page=1&rowsPerPage=25&filterWhere%5Bpago%5D=0&filterWhere%5Bcliente_id%5D=216' \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'setfisio: 9208'
```

Cada item traz `servico_ciclo_id` — filtrar pelo `cicloId` do plano (vem do
`GET /api/cliente/:id/listar-vendas`). O `titulo` também referencia o plano:

```JSON
{
  "id": 827,
  "titulo": "Ref. serviço 154 ciclo: 20/08/2026",
  "valor": 200,
  "pago": 0,
  "data_vencimento": "2026-08-20",
  "servico_ciclo_id": 640
}
```

Filtros usados pela UI (opcionais): `filterWhere[pago]=0`,
`filterWhere[cliente_id]=<id>`, `filterWhere[data_vencimento_final]=<YYYY-MM-DD>`.

## 2. Ler a cobrança completa

```CURL
curl 'https://api.seufisio.com.br/api/conta-receber/827' \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'setfisio: 9208'
```

Retorna 71 campos, incluindo o objeto `cliente` aninhado.

## 3. Aplicar o desconto

**`PUT /api/conta-receber/:id` exige o objeto inteiro de volta** (todos os 71 campos do GET,
incluindo o `cliente` aninhado), com 5 alterações:

| Campo | Valor |
| --- | --- |
| `valor` | novo valor com desconto (`150`) |
| `descricao` | texto do desconto (formato abaixo) |
| `descontar` | `true` — campo novo, não existe no GET |
| `parcelar` | `false` — campo novo |
| `parcelas` | `[]` — campo novo |

Nada mais muda. `valor_bruto` vai como o valor **antigo** (200) e a API recalcula para 150
na resposta.

Formato do `descricao` gerado pela UI:

```
Valor Original: R$ 200,00\nAplic. Desc. de R$ 50,00(25,00%), R$ 150,00.
```

Atenção: o `\n` é **literal, dois caracteres** (barra invertida + `n`), não uma quebra de
linha real. Em JSON isso vira `"...R$ 200,00\\nAplic...."`. O percentual é calculado
(50 / 200 = 25,00%). Valores formatados em pt-BR com `R$ ` e vírgula decimal.

Implementação: `GET /api/conta-receber/:id` → spread → sobrescreve os 5 campos → `PUT`.

```CURL
curl 'https://api.seufisio.com.br/api/conta-receber/827' \
  -X PUT \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'content-type: application/json' \
  -H 'setfisio: 9208' \
  --data-raw '{ <objeto completo do GET>, "valor":150, "descricao":"Valor Original: R$ 200,00\\nAplic. Desc. de R$ 50,00(25,00%), R$ 150,00.", "descontar":true, "parcelar":false, "parcelas":[] }'
```

Resposta 200: o objeto atualizado, com `valor: 150` e `valor_bruto: 150`.

## Observações

- Não existe campo `desconto`. O desconto é só o `valor` menor + o texto em `descricao`.
- A conta gerada pelo plano tem `eh_conta_manual: false` e `gateway_pagamento: "juno"`.
- O agente precisa **perguntar se houve valor pago antes** (avaliação, sessão avulsa) antes
  de encerrar a criação do plano. Se houve, aplica o desconto nesta primeira cobrança.
