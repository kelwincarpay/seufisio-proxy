# Plano recorrente (`cliente-servico`) — leitura e edição

Spec das rotas `/api/plans/recurring/:planId` (GET e PUT), que leem e editam um `serviço
recorrente` (`cliente-servico`) do SeuFisio. Formato igual ao de `docs/api-specs.md` — uma
seção por endpoint com Endpoint / Purpose / Request / Business Logic / Success / Error
Responses — mais uma seção final de Error Reference e "O que mudou" para a skill do
OpenClaw.

## Índice

1. [GET /api/plans/recurring/:planId](#1-get-apiplansrecurringplanid)
2. [PUT /api/plans/recurring/:planId](#2-put-apiplansrecurringplanid)
3. [Error Reference](#3-error-reference)
4. [O que mudou](#4-o-que-mudou)

---

## 1. GET /api/plans/recurring/:planId

### Endpoint

```
GET /api/plans/recurring/:planId[?raw=1]
Authorization: <API_SECRET_TOKEN, como as demais rotas /api>
```

### Purpose

Lê um plano recorrente (`cliente-servico`) já normalizado no formato que a skill consome:
serviço, grade semanal, valor, desconto, dia de cobrança e o limite semanal do serviço.

### Request

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `planId` | number | Sim | ID do `cliente-servico` (path) |
| `raw` | `1` | Não | Quando `1`, inclui o objeto upstream cru em `raw` |

Não aceita mais `?cliente_id=` (ver [O que mudou](#4-o-que-mudou)).

### Business Logic

- Busca o `cliente-servico` upstream por `planId` e o `tipo_atendimento` associado.
- Monta a grade semanal (`dias`) a partir dos campos de dia/hora/profissional/sala do
  upstream, um item por dia com slot preenchido.
- `limite_semanal` vem do nome do serviço (`nome_exibicao_tipo_atendimento` /
  `tipo_atendimento.nome`), procurando o padrão "Nx na Semana" (case-insensitive). Quando o
  nome não casa com o padrão, `limite_semanal` é `null` e a resposta inclui `aviso`
  explicando que o limite não pôde ser lido.
- Uma leitura simples (sem edição) não consulta a agenda/calendário: `dias[].lotado` vem
  sempre `null` no GET — só uma edição, que passa pela grade, sabe se o slot está cheio.
- `?raw=1` anexa o `cliente-servico` upstream sem normalização em `raw`, para depuração.

### Success Response

**HTTP 200** — `NormalizedRecurringPlan`

```jsonc
{
  "id": 125,
  "cliente_id": 322,
  "servico": { "id": 8, "nome": "Pilates 1x na Semana" },
  "dias": [
    {
      "dia": "quinta",
      "hora": "10:00",
      "profissional": { "id": 1, "nome": "Pri S." },
      "sala": 1,
      "lotado": null
    }
  ],
  "valor_mensal": 200,
  "percentual_desconto": 0,
  "dia_vencimento": 15,
  "limite_semanal": 1,
  "horarios": "quinta às 10h",
  "raw": { "...": "só com ?raw=1" }
}
```

Quando o nome do serviço não bate com o padrão "Nx na Semana":

```jsonc
{
  "...": "...",
  "limite_semanal": null,
  "aviso": "Limite semanal não pôde ser determinado pelo nome do serviço, então a quantidade de dias não foi conferida."
}
```

### Error Responses

| Status | Body | Condição |
|--------|------|----------|
| upstream 4xx | `{ "error": "...", "details": "..." }` — mesmo status do upstream | `planId` inexistente ou erro de validação do SeuFisio |
| `500` | `{ "error": "...", "details": "..." }` | Erro 5xx do upstream ou falha de rede |

---

## 2. PUT /api/plans/recurring/:planId

### Endpoint

```
PUT /api/plans/recurring/:planId[?raw=1]
Authorization: <API_SECRET_TOKEN, como as demais rotas /api>
Content-Type: application/json
```

### Purpose

Edita um plano recorrente existente: grade semanal, tipo de atendimento, valor mensal,
percentual de desconto e/ou dia de vencimento. Aplica as mudanças sobre o objeto lido
upstream e envia o objeto completo de volta (`PUT` full-object, como em `charges.ts`).

### Request

Body — todos os campos são opcionais, mas o corpo não pode vir vazio:

```jsonc
{
  "dia_vencimento": 15,               // 1-31
  "dias": [
    { "dia": "terca", "hora": "09:00", "profissional_id": 3 }
    // dia: "segunda".."domingo"; hora: "HH:mm"; profissional_id opcional (null = sem preferência)
  ],
  "tipo_atendimento_id": 9,
  "valor_mensal": 220,
  "percentual_desconto": 10            // 0-100
}
```

Corpo vazio (`{}` ou sem body) → `400`.

### Business Logic

- **Grade (`dias`)**: quando presente, substitui a grade semanal inteira (não é um merge
  parcial). A "âncora" da grade (a partir de quando os horários são consultados) é sempre
  hoje.
  - Sem `profissional_id`: cada `dia`/`hora` é validado contra a grade de horários
    disponíveis do serviço; um dia/hora sem slot correspondente é rejeitado com `400`
    antes de qualquer escrita.
  - Com `profissional_id` informado: esse profissional prevalece, mas a agenda dele
    naquele dia/hora ainda é consultada para reportar a capacidade honestamente. Se
    existir slot, `vagas` vem de `slot.available_spots` e `lotado` é `true` quando o
    slot está cheio (`!slot.available`); se não existir slot nenhum para aquele
    profissional/horário, o dia ainda é gravado como pedido (`vagas: 0`,
    `lotado: false`) e não há `400` por falta de slot. Ainda assim, se o studio tiver
    mais de uma sala ativa e nenhuma puder ser resolvida automaticamente (`sala_id` não
    é aceito no body), o PUT falha com `400` e `problemas` (`"sala_id é obrigatório..."`).
- **Limite semanal**: contagem dos dias pedidos é comparada ao `limite_semanal` do serviço
  (lido do nome, igual ao GET). Se o serviço não tiver `tipo_atendimento_id` novo, usa o
  limite do serviço atual; se `tipo_atendimento_id` for trocado, usa o limite do **novo**
  serviço. Excedeu o limite → sempre `400` sem gravar nada; não existe confirmação ou
  override que force a gravação. Quando o nome do serviço não permite ler o limite
  (`limite_semanal: null`), a contagem de dias não é validada contra limite nenhum.
- **Preço**:
  - `valor_mensal` informado no body → esse valor é gravado congelado (`congelar_valor:
    true`, `valor_congelado: <valor>`), independentemente do serviço.
  - `tipo_atendimento_id` trocado sem `valor_mensal` → o preço é recalculado pela mesma
    regra usada na criação do plano (tabela de preço do novo serviço/periodicidade).
  - Nem `valor_mensal` nem `tipo_atendimento_id` mudou → mantém o preço lido upstream
    (`congelar_valor`/`valor_congelado` como estavam).
- **Dia de vencimento**: `dia_vencimento` grava `dia_padrao_cobranca` no upstream. Nunca
  mexe em `dia_padrao_renovacao` nem em `data_encerramento` — esses campos são copiados tal
  como foram lidos, mesmo quando a grade ou o serviço mudam.
- **Turma cheia (`lotado`)**: só é resolvido para os dias enviados em `dias` naquele PUT —
  vem da mesma atribuição de profissional/sala que consultou a agenda para montá-los. Um
  PUT sem `dias` não passa pela agenda, então `dias[].lotado` volta `null`, igual o GET.
  Quando resolvido, um slot sem vaga volta com `dias[].lotado: true`, mas a edição já foi
  gravada — `lotado` é só um aviso, não bloqueia a escrita.
- **`profissional.nome`**: sempre resolvido no PUT (busca a lista de profissionais igual o
  GET); prevalece o nome da lista de profissionais e só cai para o nome vindo da
  atribuição de vaga quando o `profissional_id` do dia não aparece nessa lista.
- **Sem efeitos colaterais**: a edição não dispara mensagem de WhatsApp nem grava nada em
  Supabase — só o `PUT` upstream do `cliente-servico`.
- `?raw=1` funciona igual ao GET, anexando o `cliente-servico` upstream em `raw` na
  resposta.

### Success Response

**HTTP 200** — `NormalizedRecurringPlan` (mesmo shape do GET). `dias[].lotado` vem
`boolean` para os dias que vieram em `dias` naquele PUT (a edição consultou a agenda para
atribuí-los); em um PUT sem `dias`, `lotado` continua `null`, igual o GET:

```jsonc
{
  "id": 125,
  "cliente_id": 322,
  "servico": { "id": 8, "nome": "Pilates 1x na Semana" },
  "dias": [
    {
      "dia": "terca",
      "hora": "09:00",
      "profissional": { "id": 3, "nome": "Ana P." },
      "sala": 1,
      "lotado": false
    }
  ],
  "valor_mensal": 220,
  "percentual_desconto": 10,
  "dia_vencimento": 15,
  "limite_semanal": 1,
  "horarios": "terça às 9h"
}
```

### Error Responses

| Status | Body | Condição |
|--------|------|----------|
| `400` | `{ "error": "..." }` | Corpo vazio, tipo/formato inválido de algum campo |
| `400` | `{ "error": "...", "problemas": [ ... ] }` | Um ou mais `dia`/`hora` pedidos sem `profissional_id` não existem na grade de horários do serviço (com `profissional_id` informado, esse dia é aceito mesmo sem slot — ver Business Logic) |
| `400` | `{ "error": "...", "limite_semanal": <n>, "dias_pedidos": <n>, "servico": "<nome>" }` | A grade pedida excede o limite semanal do serviço — sempre rejeitado, não existe override |
| upstream 4xx | `{ "error": "...", "details": "..." }` — mesmo status do upstream | Ex.: `planId` inexistente |
| `500` | `{ "error": "...", "details": "..." }` | Erro 5xx do upstream ou falha de rede |

---

## 3. Error Reference

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Sucesso |
| `400` | Erro do cliente — body vazio, formato inválido, dia/hora sem slot na grade, ou limite semanal excedido |
| upstream 4xx | Repassado com o mesmo status do SeuFisio (ex.: 404 para `planId` inexistente) |
| `500` | Erro do SeuFisio (5xx) ou falha de rede/exceção não tratada |

### Corpo de erro

Erros repassados do upstream (4xx/5xx) sempre têm o formato:

```json
{ "error": "<mensagem>", "details": "<corpo ou mensagem crua do upstream>" }
```

Erros de validação da própria rota (400) variam pelo caso, ver a tabela de cada endpoint
acima — alguns trazem `problemas`, outros `limite_semanal`/`dias_pedidos`/`servico` para dar
contexto suficiente pra skill decidir se repete a chamada com uma grade diferente.

---

## 4. O que mudou

Para atualizar a skill do OpenClaw que já conhecia a rota `GET` antiga (`ATUALIZACAO-SKILL-OPENCLAW.md`
§17 "Get Recurring Plan"):

- **`GET` não aceita mais `?cliente_id=`.** Antes era obrigatório (`cliente_id` era a fonte
  da lista); agora o plano é lido só por `planId`.
- **Deixam de existir**: `atendimentos_feitos`, `atendimentos_repor`, `validade`,
  `pausado_em`. Esses campos não fazem parte da resposta normalizada.
- **Campos novos**: `percentual_desconto`, `dia_vencimento`, `limite_semanal`, `horarios`
  (string legível, como antes, mas agora sempre presente) e `dias[].lotado` (indicador de
  turma cheia; `null` no GET, e no PUT só é `boolean` para os dias enviados em `dias`
  naquele request — sem `dias`, continua `null`).
- **`horarios` passa a ser gerado pelo proxy** (`scheduleText(...)`, a mesma função usada
  no `POST /api/plans`), não mais o `informacoes` cru do upstream: é uma frase curta tipo
  "quinta às 10h" ou "terça e quinta às 9h", sem nome de profissional nem sala.
- **Nova rota de escrita**: `PUT /api/plans/recurring/:planId` — antes não existia edição de
  plano recorrente pela skill; agora é possível trocar grade, serviço, valor, desconto e
  dia de vencimento num único request.
