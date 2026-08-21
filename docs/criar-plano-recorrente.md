# Criar plano recorrente (serviço recorrente)

Entidade **`cliente-servico`** (`tipoVenda: "servico_recorrente"`). Não confundir com
`pacote` / `pacote_personalizado`, que é o que as rotas atuais de `src/routes/plans.ts`
manipulam (`/api/pacote/:id`). Um cliente pode ter os dois ao mesmo tempo.

Capturado de `app.seufisio.com.br.har` (21/08/2026, cliente 216, plano 154).

## Fluxo: 2 requests

1. `POST /api/cliente-servico/validar-criacao` — mesmo payload da criação
2. `POST /api/cliente-servico` — cria (201)

### 1. Validar

```CURL
curl 'https://api.seufisio.com.br/api/cliente-servico/validar-criacao' \
  -X POST \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'content-type: application/json' \
  -H 'setfisio: 9208' \
  -H 'x-version-app: 34' \
  --data-raw '<mesmo payload do POST abaixo>'
```

```JSON
{ "codigo": "ok", "pode_prosseguir": true, "conflito": null }
```

Regra de negócio acordada: **não validamos superlotação**. Se `pode_prosseguir` for
`false` ou vier `conflito`, o proxy devolve a mensagem para o agente **pedir confirmação
ao usuário** antes de criar.

### 2. Criar

```CURL
curl 'https://api.seufisio.com.br/api/cliente-servico' \
  -X POST \
  -H 'authorization: Bearer <TOKEN>' \
  -H 'content-type: application/json' \
  -H 'setfisio: 9208' \
  -H 'x-version-app: 34' \
  --data-raw '{ ... }'
```

Payload completo (captura real — semestral, terça e quinta 09:00, Pri, Sala 01):

```JSON
{
  "domingo": false, "segunda": false, "terca": true, "quarta": false,
  "quinta": true, "sexta": false, "sabado": false,
  "sala_id_domingo": null, "sala_id_segunda": null, "sala_id_terca": 1,
  "sala_id_quarta": null, "sala_id_quinta": 1, "sala_id_sexta": null, "sala_id_sabado": null,
  "profissional_id_domingo": null, "profissional_id_segunda": null, "profissional_id_terca": 1,
  "profissional_id_quarta": null, "profissional_id_quinta": 1,
  "profissional_id_sexta": null, "profissional_id_sabado": null,
  "hora_domingo": "", "hora_segunda": "", "hora_terca": "09:00", "hora_quarta": "",
  "hora_quinta": "09:00", "hora_sexta": "", "hora_sabado": "",
  "periodicidade": 6,
  "created_by_user_id": 45390,
  "possui_dias_fixos": 1,
  "possui_data_encerramento": true,
  "percentual_desconto": 0,
  "servico_gratis": false,
  "cobranca_automatica": false,
  "forma_pagamento": "",
  "cartao_credito_id": null,
  "stripe_payment_method_id": null,
  "quantidade_reposicoes_por_ciclo": null,
  "ignorar_quantidade_reposicoes_por_ciclo": true,
  "permitir_justificar_ausencia_app_checkin": true,
  "permitir_reposicoes_apos_termino": false,
  "configurar_sem_dias_fixos": false,
  "nome_exibicao_tipo_atendimento": "Pilates 1x na Semana",
  "congelar_valor": true,
  "gerar_todos_ciclos": false,
  "valor_congelado": 200,
  "inicio_servico": "2026-08-20",
  "data_encerramento": "02/2027",
  "dia_padrao_renovacao": "20",
  "dia_padrao_cobranca": "20",
  "tipo_atendimento_id": 8,
  "cliente_id": "216"
}
```

Resposta 201 (campos que importam):

```JSON
{
  "id": 154,
  "cliente_id": 216,
  "tipo_atendimento_id": 8,
  "periodicidade": 6,
  "inicio_servico": "2026-08-20",
  "data_encerramento": "2027-02-19",
  "dia_padrao_renovacao": 20,
  "dia_padrao_cobranca": 20,
  "hora_terca": "09:00:00",
  "possui_dias_fixos": true,
  "percentual_desconto": "0.0000",
  "congelar_valor": true,
  "valor_congelado": 200,
  "quantidade_reposicoes_por_ciclo": 0,
  "is_encerrado": false
}
```

## Semântica dos campos

### Grade semanal

7 dias × 4 campos: `{dia}` (bool), `sala_id_{dia}`, `profissional_id_{dia}`, `hora_{dia}`.
Dia não usado vai `false` / `null` / `""` — **string vazia na hora, não `null`**.
Mesmo shape que `PUT /api/pacote/:id/atualizar-horarios` já usa.

### `periodicidade` — é o número de meses

Decodificado via `GET /api/tipos-aluno`: os `value` do enum são 0/5/1/4/2/8/3, e não existe
`value: 6`. O `6` enviado corresponde ao **`periodo`** (meses):

| `periodo` (= `periodicidade`) | Label | Campo de valor no tipo_atendimento |
| --- | --- | --- |
| 1 | Mensal | `valor_mensal` |
| 2 | Bimestral | `valor_bimestral` |
| 3 | Trimestral | `valor_trimestral` |
| 4 | Quadrimestral | `valor_quadrimestral` |
| 6 | Semestral | `valor_semestral` |
| 8 | Octomestral | `valor_octomestral` |
| 12 | Anual | `valor_anual` |

Confirmado pelo contrato gerado depois, que renderizou `Plano: Semestral`.

O MovArt usa só **Mensal (1)** e **Semestral (6)**.

### Valor: mensal segue a tabela, semestral congela

Duas capturas, dois comportamentos diferentes:

| | Mensal | Semestral |
| --- | --- | --- |
| `congelar_valor` | `false` | `true` |
| `valor_congelado` | `""` | `200` |
| efeito | segue `valor_mensal` da tabela (290) e acompanha reajuste | fixa a parcela, imune a reajuste |

Faz sentido: `valor_mensal` já é o valor da cobrança mensal, então não há o que congelar.
No semestral a tabela só tem o **total do ciclo** (`valor_semestral: 1200`), e cobrar
R$ 200/mês exige fixar os 200 — daí `valor_congelado = tabela[periodicidade] ÷
periodicidade`. O contrato gerado renderizou `Valor: R$ 200,00 por mês`, confirmando que
semestral é **6 parcelas de R$ 200**, não R$ 1.200 à vista.

Valor customizado congela em qualquer periodicidade: `congelar_valor: true` com o valor
pedido. Só usar quando solicitado.

Tabela ativa hoje (`GET /api/tipo-atendimento?rowsPerPage=all`):

| id | nome | mensal | semestral | → parcela semestral |
| --- | --- | --- | --- | --- |
| 8 | Pilates 1x na Semana | 290 | 1200 | 200 |
| 9 | Pilates 2x na Semana | 465 | 2010 | 335 |
| 10 | Pilates 3x na Semana | 670 | 2880 | 480 |

### Datas

- `inicio_servico`: `YYYY-MM-DD`.
- `data_encerramento`: com encerramento vai como **`MM/YYYY`** e volta como data completa
  (a API calcula o dia: `2026-08-20` + 6 meses − 1 dia = `2027-02-19`). **Sem encerramento
  vai como string vazia `""`**, não `null`.
- `possui_data_encerramento`: no MovArt **todo plano mensal é sem encerramento** e o
  semestral tem prazo. O default do proxy deriva disso: `periodicidade > 1`.
- `dia_padrao_renovacao` / `dia_padrao_cobranca`: string com o **dia de `inicio_servico`** (`"20"`).

### Outros

- `created_by_user_id`: vem de `GET /api/user/user` → `id` (45390 = usuário Financeiroc).
- `nome_exibicao_tipo_atendimento`: copia `tipo_atendimento.nome`; é o rótulo exibido.
- `possui_dias_fixos: 1` (número no request, `true` na resposta). `configurar_sem_dias_fixos`
  sempre `false` — o studio não usa.
- `cobranca_automatica` + `forma_pagamento` + cartão/stripe: **V2**, sempre `false`/`""`/`null`.
- `cliente_id` vai como string; a API aceita e devolve number.

## Efeitos colaterais da criação

1. **Cria o ciclo** (`cicloId: 640`, visível em `GET /api/cliente/:id/listar-vendas`).
2. **Gera atendimentos retroativos** — `inicio_servico` 20/08 era quinta, o plano tem quinta
   09:00, e o `listar-vendas` já retornou `atendimentosFeitos: 1`. Comportamento esperado.
   Quando `inicio_servico < hoje`, `POST /api/plans` devolve `atendimentos_retroativos` com
   as datas (calculadas da grade) e o `atendimentosFeitos` lido de volta, para o agente
   avisar quem vendeu em vez de a surpresa aparecer depois. Feriado não tem sessão, então a
   contagem calculada é limite superior.
3. **Gera a cobrança do primeiro ciclo** — `conta_receber` 827,
   `titulo: "Ref. serviço 154 ciclo: 20/08/2026"`, `servico_ciclo_id: 640`, `valor: 200`,
   `data_vencimento: 2026-08-20`. Ver `desconto-primeira-cobranca.md`.

Com `gerar_todos_ciclos: false` só o primeiro ciclo é gerado.

## Lookups necessários

| Endpoint | Uso |
| --- | --- |
| `GET /api/user/user` | `created_by_user_id` |
| `GET /api/tipo-atendimento?rowsPerPage=all` | id + tabela de preço |
| `GET /api/tipos-aluno` | mapa periodicidade → label/campo de valor |
| `GET /api/sala?rowsPerPage=all` | hoje só `Sala 01` (id 1) |
| `GET /api/profissional/todos-profissionais` | id 1 Pri (ativo), 2 Andressa (inativo), 3 Amanda (ativo) — filtrar por `ativo` |
| `GET /api/cliente?filter=<nome>&...` | resolver nome → `cliente_id` |

`GET /api/profissional?rowsPerPage=all` retorna uma lista menor e sem a flag `ativo` —
usar `todos-profissionais`.

## Segunda captura: mensal sem encerramento

21/08/2026, mesmo cliente, plano **mensal** (`periodicidade: 1`), uma terça 18:00 com
Amanda (prof 3), sem data de encerramento. Só o que difere do semestral:

```JSON
{
  "periodicidade": 1,
  "possui_data_encerramento": false,
  "data_encerramento": "",
  "congelar_valor": false,
  "valor_congelado": "",
  "inicio_servico": "2026-08-21",
  "dia_padrao_renovacao": "21",
  "dia_padrao_cobranca": "21",
  "created_by_user_id": 21714
}
```

O `created_by_user_id` mudou porque foi outro usuário do studio — o proxy lê de
`GET /api/user/user`, então acompanha sozinho.

`scripts/check-payloads.ts` compara o `buildPlanPayload` contra **as duas** capturas.

## Pendente de captura

- Shape do `conflito` no `validar-criacao` quando há choque de horário.
