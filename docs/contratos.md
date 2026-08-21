# Contratos (Contrato Cliente + Termo de Consentimento)

Dois contratos são gerados por plano, a partir de modelos cadastrados no SeuFisio.
O texto é renderizado no servidor com os dados do cliente e do plano, e o contrato é
"congelado" como HTML no momento da criação.

Capturado de `app.seufisio.com.br-fatura-contrato.har` (cliente 216, plano 154,
contratos 100 e 101).

## Modelos disponíveis

```CURL
curl 'https://api.seufisio.com.br/api/modelo-contrato/options?modulo=App%5CCliente' \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'setfisio: 9208'
```

```JSON
[
  { "value": 1, "label": "Contrato Cliente Pacote", "is_usado_para_pacotes": 1, "ativo": 1 },
  { "value": 2, "label": "Termo de Consentimento",  "is_usado_para_pacotes": 1, "ativo": 1 }
]
```

O `modulo` na query é `App\Cliente` (urlencoded `App%5CCliente`). São os dois modelos
que o MovArt usa — gerar **os dois** para todo plano novo.

## Fluxo por contrato: 3 requests

### 1. Descobrir o `modulo` / `modulo_id` do plano

```CURL
curl 'https://api.seufisio.com.br/api/modelo-contrato/get-pacotes/216' \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'setfisio: 9208'
```

```JSON
[
  {
    "id": "App\\ClienteServico_154",
    "pacote_number": 154,
    "data_inicial": "2026-08-20",
    "data_final": null,
    "tipo_atendimento_id": "8",
    "is_pacote_fixo": 0,
    "modelo_tipo": 3,
    "tipo_atendimento": "Pilates 1x na Semana"
  },
  {
    "id": "App\\Pacote_15",
    "pacote_number": 15,
    "modelo_tipo": 2,
    "tipo_atendimento": "Sessão Avulsa"
  }
]
```

O `id` é `<classe>_<id>`: plano recorrente → `App\ClienteServico_154`, pacote →
`App\Pacote_15`. Daí saem `modulo: "App\\ClienteServico"` e `modulo_id: "154"`.
Como já temos o id do plano da criação, esse GET é dispensável — serve para conferência.

### 2. Renderizar o texto

```CURL
curl 'https://api.seufisio.com.br/api/modelo-contrato/get-contrato-completo/1' \
  -X POST \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'content-type: application/json' \
  -H 'setfisio: 9208' \
  --data-raw '{"modulo_id":"154","modulo":"App\\ClienteServico","modelo_contrato_id":1}'
```

O `1` da URL é o `modelo_contrato_id` (repetido no body).

```JSON
{
  "nome_contrato": "Contrato Cliente Pacote",
  "texto": "<span><p style=\"text-align:center;\">…</p>"
}
```

O `texto` volta com as variáveis já substituídas (HTML com entidades, ~11 KB):
nome, CPF, `Início: 20/08/2026`, `Plano: Semestral`,
`Quantidade de sessão por semana: Pilates 1x na Semana`, `Valor: R$ 200,00 por mês`.

As variáveis que o modelo pode usar estão em
`GET /api/modelo-contrato/get-propriedades/:modeloId` (endpoint só de UI): nome, cpf, rg,
data nascimento, rua, número, complemento, bairro, cidade, uf, cep, telefone, e-mail,
estado civil, profissão, além de dados da clínica e do plano.

**Consequência importante:** o texto é um snapshot. Gerar o contrato antes do cliente
completar o cadastro produz um contrato com endereço/profissão/nascimento em branco. Por
isso o contrato só é criado **depois** que o cadastro está completo — ver
`onboarding-plano.md`.

### 3. Criar o contrato

```CURL
curl 'https://api.seufisio.com.br/api/contrato' \
  -X POST \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'content-type: application/json' \
  -H 'setfisio: 9208' \
  --data-raw '{"nome_contrato":"Contrato Cliente Pacote","texto":"<html renderizado do passo 2>","modulo_id":"154","modulo":"App\\ClienteServico","cliente_id":216,"modelo_contrato_id":1}'
```

O `texto` é repassado igual ao que veio do passo 2 (o servidor sanitiza: 11322 → 9592 chars).

```JSON
{
  "id": 100,
  "nome_contrato": "Contrato Cliente Pacote",
  "modulo": "App\\Models\\ClienteServico",
  "modulo_id": "154",
  "cliente_id": 216,
  "modelo_contrato_id": 1,
  "responsavel_id": 45390,
  "created_at": "2026-08-21T20:17:06.000000Z"
}
```

A resposta devolve `modulo` como `App\Models\ClienteServico`; **no request use
`App\ClienteServico`**.

Repetir os passos 2 e 3 com `modelo_contrato_id: 2` para o Termo de Consentimento
(contrato 101).

## Link de assinatura

```CURL
curl 'https://api.seufisio.com.br/api/contrato/100/link' \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'setfisio: 9208'
```

Resposta: uma string com a URL pública.

```JSON
"https://api.seufisio.com/visualizar-contrato/eyJpdiI6Ikg5MHZZcFhKRm1WU0hReGZ6QkRMN0E9PSIsInZhbHVlIjoi…"
```

Domínio `api.seufisio.com` (sem `.com.br`), path com payload criptografado (Laravel
`encrypt`). Um link por contrato — são dois links por plano.

## Consultar status de assinatura

```CURL
curl 'https://api.seufisio.com.br/api/relatorio/contrato?page=1&rowsPerPage=100&descending=false&filtro_where_data=criacao&filtro_situacao=ambos&filtro_aceitou=ambos&filtro_vigente=ambos&filtro_cliente_id=216' \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'setfisio: 9208'
```

Resposta paginada Laravel (`{ data, total, current_page, … }`). Um item por contrato.

### Campos de estado — confirmado com assinatura real

Contrato **100 assinado** vs. contrato **101 pendente**, mesma resposta:

| Campo | 100 (assinado) | 101 (pendente) |
| --- | --- | --- |
| `data_hora_abertura` | `2026-08-21 17:28:13` | `null` |
| `data_hora_aceite` | `2026-08-21 17:28:49` | `null` |
| `data_hora_assinatura` | `2026-08-21 17:28:49` | `null` |
| `assinatura` | `data:image/png;base64,…` | `null` |
| `tipo_assinatura` | `1` | `null` |
| `ip_address` | `201.68.241.246` | `null` |
| `user_agent` | `Chrome - OS X` | `null` |
| `updated_at` | bump para a hora da assinatura | igual ao `created_at` |
| **`aceitou`** | **`1`** | **`1`** |

A assinatura é um desenho: `assinatura` vem como PNG em data-URI (o cliente assina com o
dedo/mouse). `tipo_assinatura: 1` = assinatura desenhada. `data_hora_aceite` e
`data_hora_assinatura` saem com o mesmo timestamp.

### ⚠️ `aceitou` não serve como critério

`aceitou: 1` nos dois, assinado e pendente. É default da coluna. Quem usasse `aceitou`
marcaria todo contrato como assinado no instante da criação.

**Critério do cron: `data_hora_assinatura != null`.**

`data_hora_abertura` preenchido com `data_hora_assinatura` nulo = o cliente abriu o link e
desistiu no meio. Dá para usar isso na mensagem de cobrança (ver `mensagens-onboarding.md`).

`data_hora_envio` continua `null` no nosso fluxo — ele é do envio por e-mail do próprio
SeuFisio, e nós mandamos o link por WhatsApp. O timestamp de envio fica no Supabase.

### Campos vazios quando o cadastro está incompleto

O Termo de Consentimento (modelo 2) do contrato 101 saiu assim:

> Eu, Kelwin Sanches Savoia, nacionalidade brasileira, estado civil `<span></span>`,
> profissão `<span></span>`, residente à `<span></span>`, nº `<span></span>`,
> Complemento `<span></span>`, Bairro `<span></span>`, localizado no município de
> `<span></span>`, estado de `<span></span>`, nascida em `<span></span>`

Nove buracos, porque o cadastro estava incompleto. Prova prática de que o contrato só pode
ser gerado depois do cadastro completo — e note que o Termo exige **`estado_civil`**, que
o Contrato Cliente não usa.

Nota: a cláusula de uso de imagem do Contrato Cliente é texto puro com `a) Sim ( )` /
`b) Não ( )`. Não há campo digital para marcar, então a autorização de imagem
(`autorizo_uso_imagem` no cliente) não é capturada pela assinatura eletrônica.

## Resumo da sequência

| Passo | Request |
| --- | --- |
| 1 | `GET /api/modelo-contrato/options?modulo=App%5CCliente` |
| 2 | `POST /api/modelo-contrato/get-contrato-completo/1` |
| 3 | `POST /api/contrato` → id 100 |
| 4 | `GET /api/contrato/100/link` |
| 5 | `POST /api/modelo-contrato/get-contrato-completo/2` |
| 6 | `POST /api/contrato` → id 101 |
| 7 | `GET /api/contrato/101/link` |
| poll | `GET /api/relatorio/contrato?…&filtro_cliente_id=216` |
