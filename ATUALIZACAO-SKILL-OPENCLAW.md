# Atualização da skill `seufisio` — venda de plano recorrente

Instruções para atualizar a skill do OpenClaw (`OPENCLAW-SKILL.md`) com o fluxo de criação
de plano recorrente, desconto na primeira cobrança e onboarding pós-venda.

Tudo abaixo já está **em produção** no proxy (deploy `6863660`, 21/08/2026). As seções
novas continuam a numeração da skill atual, que termina em **15. Update Plan Schedule** —
as novas entram como 16 a 21, seguidas de um novo bloco de fluxo e de exemplos.

O conteúdo em inglês é para colar direto na skill, que é escrita em inglês. Este preâmbulo
e as notas em português são só para você.

---

## O que muda, em uma frase por bloco

1. **Criar plano recorrente** — o agente passa a vender plano (mensal ou semestral), não só
   agendar sessão avulsa. Uma chamada faz validação, criação, desconto e disparo do
   onboarding.
2. **Desconto na primeira cobrança** — quando o cliente já pagou algo antes (a Sessão
   Avaliação de R$ 50, por exemplo), esse valor entra como desconto na cobrança que o plano
   gera.
3. **Onboarding pós-venda** — link de cadastro, geração dos dois contratos e cobrança de
   assinatura acontecem **sozinhos**, num cron do proxy. O agente só consulta e responde.

## Três conceitos que a skill precisa entender

**Plano recorrente ≠ pacote.** São entidades diferentes no SeuFisio, convivendo no mesmo
cliente. O `GET /api/clients/:id/sales` mostra qual é qual pelo campo `tipoVenda`:

| `tipoVenda` | O que é | Endpoints |
|---|---|---|
| `servico_recorrente` | plano mensal/semestral (novo) | `POST /api/plans`, `GET /api/plans/recurring/:id` |
| `pacote_personalizado` | pacote de sessões (já existia) | `GET /api/plans/:id`, `PUT /api/plans/:id/schedule` |

As seções 14 e 15 da skill atual **só funcionam com pacote**. Não use `GET /api/plans/:id`
para um plano recorrente.

**`periodicidade` é número de meses, não código.** `1` = Mensal, `6` = Semestral. O MovArt
usa só esses dois.

**O agente não cria cron, não agenda follow-up e não promete "vou te avisar".** O proxy
cuida de tudo depois da venda. Se o usuário perguntar do andamento, o agente consulta o
`GET /api/onboarding/:clienteId` na hora.

---

# Seções para adicionar à skill

Colar depois da seção 15, antes do bloco `## Change Plan Schedule Skill — Step-by-Step Flow`.

---

## Recurring Plan APIs

These APIs sell and read **recurring plans** (`servico_recorrente`) — the monthly or
semester Pilates plans. They are a different entity from `pacote_personalizado`, which
sections 14 and 15 handle.

---

### 16. Create Recurring Plan

Sell a recurring plan to a client. This single call validates the schedule upstream,
creates the plan, optionally applies a discount to the generated charge, and starts the
onboarding flow (registration link + contracts).

**Request:**
```
POST {{SEUFISIO_PROXY_URL}}/api/plans
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{
  "cliente_id": 216,
  "tipo_atendimento_id": 8,
  "periodicidade": 6,
  "inicio_servico": "2026-08-20",
  "dias": [
    { "dia": "terca",  "hora": "09:00" },
    { "dia": "quinta", "hora": "09:00" }
  ],
  "desconto": { "valor": 50 }
}
```

**Parameters (in body):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cliente_id | number | Yes | Client ID |
| tipo_atendimento_id | number | Yes | Service type ID (from `GET /api/attendance-types`) |
| periodicidade | number | Yes | Plan length **in months**: `1` = Mensal, `6` = Semestral |
| inicio_servico | string | Yes | Start date (YYYY-MM-DD) |
| dias | array | Yes | The weekly grid. One entry per session day |
| dias[].dia | string | Yes | `domingo`, `segunda`, `terca`, `quarta`, `quinta`, `sexta`, `sabado` (no accents) |
| dias[].hora | string | Yes | `HH:MM` |
| dias[].profissional_id | number | No | **Leave it out.** The proxy reads the calendar and assigns whoever works that day/time. Send it only to force a specific professional |
| dias[].sala_id | number | No | Leave it out — resolved automatically (the studio has one room) |
| possui_data_encerramento | boolean | No | Leave it out. The default follows the studio rule: **Mensal runs open-ended, Semestral gets an end date** derived from `periodicidade` |
| valor_congelado | number | No | Custom monthly price. **Only send when the user explicitly asks for a custom value** |
| desconto | object | No | Credit already paid, applied to the first generated charge |
| desconto.valor | number | No | Amount to discount (e.g. `50` for a paid Sessão Avaliação) |
| confirmar | boolean | No | Send `true` to proceed after a 409 warning |
| onboarding | boolean | No | Default `true`. Only send `false` if the user does not want the WhatsApp flow |

**Number of days must match the plan type.** "Pilates 1x na Semana" takes 1 entry in
`dias`, "2x na Semana" takes 2, "3x na Semana" takes 3.

**The professional is assigned by the proxy**, using the same rule as the create-attendance
flow: it takes the next occurrence of that weekday, reads the calendar, and picks the
professional whose slot starts at the requested time. You do not have to query the calendar
first, and you should not guess or ask the user who it will be. Each day can end up with a
different professional. The response tells you who was assigned, in `dias`.

**The price is automatic.** Do not compute or ask for it: the proxy reads the studio price
table and derives the monthly instalment from `periodicidade`. For "Pilates 1x na Semana",
Mensal is R$ 290/month and Semestral is R$ 200/month. Confirm the value to the user from
the response, not before the call.

The two periods behave differently, and the response says which one applied through
`plan.valor_travado`:

| | Mensal | Semestral |
|---|---|---|
| End date | none, runs open-ended | derived from the period |
| Price | follows the studio table, moves with a price increase | frozen at the monthly instalment |
| `valor_travado` | `false` | `true` |

Worth mentioning to the user when it matters: a monthly plan follows a future price
increase, a semester plan does not.

**Response (201):**
```json
{
  "success": true,
  "plan": {
    "id": 154,
    "cliente_id": 216,
    "tipo_atendimento": "Pilates 1x na Semana",
    "periodicidade": 6,
    "periodicidade_label": "Semestral",
    "inicio_servico": "2026-08-20",
    "data_encerramento": "2027-02-19",
    "dia_padrao_cobranca": 20,
    "valor_mensal": 200,
    "valor_travado": true,
    "horarios": "terça e quinta às 9h"
  },
  "validation": { "codigo": "ok", "pode_prosseguir": true, "conflito": null },
  "dias": [
    { "dia": "terca", "hora": "09:00", "profissional_id": 1, "profissional_nome": "Pri Savoia",
      "sala_id": 1, "data_referencia": "2026-08-25", "vagas": 2, "lotado": false,
      "atribuido_automaticamente": true },
    { "dia": "quinta", "hora": "09:00", "profissional_id": 3, "profissional_nome": "Amanda Mel",
      "sala_id": 1, "data_referencia": "2026-08-27", "vagas": 0, "lotado": true,
      "atribuido_automaticamente": true }
  ],
  "atendimentos_retroativos": {
    "inicio_no_passado": true,
    "inicio_servico": "2026-08-20",
    "hoje": "2026-08-21",
    "quantidade_prevista": 1,
    "atendimentos_contabilizados": 1,
    "sessoes": [
      { "data": "2026-08-20", "dia": "quinta", "dia_label": "quinta", "hora": "09:00" }
    ],
    "aviso": "O plano começou em 2026-08-20, antes de hoje, então o SeuFisio gerou 1 atendimento(s) retroativo(s). Avise o usuário e confirme se é isso que ele queria."
  },
  "desconto": {
    "aplicado": true,
    "conta_receber_id": 827,
    "valor_original": 200,
    "valor_desconto": 50,
    "valor_final": 150
  },
  "onboarding": {
    "estado": "cadastro_pendente",
    "link_cadastro": "https://api.seufisio.com/cadastro-completo/fb3bd489-...",
    "telefone": "5511970231208",
    "mensagem_enviada": true
  }
}
```

**`dias`** is the resolved weekly grid. Report the professional per day from
`profissional_nome`. `lotado: true` means the slot is already at capacity — mention it, but
it does **not** block the sale (studio decision). `atribuido_automaticamente: false` means
the professional came from your request, not from the calendar.

**Response (400) — no professional could be assigned:**
```json
{
  "error": "Não foi possível definir profissional para todos os dias pedidos",
  "problemas": [
    { "dia": "quinta", "hora": "07:00", "motivo": "Nenhum horário de 07:00 na agenda de quinta (referência 2026-08-27)",
      "horarios_disponiveis": ["08:00", "09:00", "10:00", "15:00"] }
  ]
}
```

This means nobody works at that time, not that the class is full. Offer the user the times
in `horarios_disponiveis` and retry with one of them.

**`atendimentos_retroativos`** is `null` when `inicio_servico` is today or in the future.
When the start date is in the past, SeuFisio **generates those sessions retroactively** and
this block reports them:

| Field | Meaning |
|-------|---------|
| quantidade_prevista | Sessions the grid lands on between the start date and today, computed from the schedule |
| atendimentos_contabilizados | What SeuFisio actually counted as done for the plan, read back after creation |
| sessoes | The dates and times, so you can list them to the user |
| aviso | Ready-made warning text |

**This is an operator-facing warning.** "The user" here is the studio person talking to the
agent, never the client. Nothing about retroactive sessions is ever sent to the client on
WhatsApp — the client-facing messages are only the registration link, the contracts and the
signature nudges, and they never mention sessions.

**You must tell the user about this** — see step 8 of the flow. Holidays have no session, so
`quantidade_prevista` is an upper bound; if it differs from
`atendimentos_contabilizados`, report both and say the difference is probably a holiday.

**Response (409) — SeuFisio warned about the schedule:**
```json
{
  "needs_confirmation": true,
  "message": "SeuFisio returned a warning for this schedule. Confirm with the user, then repeat the request with confirmar: true.",
  "validation": { "pode_prosseguir": false, "conflito": "..." },
  "resumo": {
    "tipo_atendimento": "Pilates 1x na Semana",
    "periodicidade": "Semestral",
    "horarios": "terça e quinta às 9h",
    "valor_mensal": 200
  }
}
```

On 409: **show the warning to the user and ask whether to proceed.** If they confirm,
repeat the exact same request with `"confirmar": true`. Never send `confirmar: true` on
the first attempt.

**Side effects of creating a plan** (all automatic, mention them only if asked):
- Attendances are generated for the cycle, **including retroactively if `inicio_servico` is
  in the past** — reported in `atendimentos_retroativos`, and you must warn the user.
- A charge (conta a receber) is created for the first cycle, due on the start day.
- The onboarding flow starts: the client gets the registration link on WhatsApp.

**Use cases:**
- Selling a new plan to a client
- Converting an evaluation client into a monthly or semester plan

---

### 17. Get Recurring Plan

Read a recurring plan: schedule, value, validity and session counts.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/plans/recurring/154?cliente_id=216
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| planId | number | Yes | Plan ID (path) |
| cliente_id | number | Yes | Client ID (query) — required, the source list is per client |

**Response:**
```json
{
  "success": true,
  "plan": {
    "id": 154,
    "ciclo_id": 640,
    "tipo_venda": "servico_recorrente",
    "tipo_atendimento": "Pilates 1x na Semana",
    "periodicidade": 6,
    "periodicidade_label": "Semestral",
    "inicio": "2026-08-20",
    "validade": "2027-02-19",
    "valor_mensal": 200,
    "horarios": [
      "Terça às 09:00, com Pri S. na sala Sala 01",
      "Quinta às 09:00, com Pri S. na sala Sala 01"
    ],
    "atendimentos_feitos": 1,
    "atendimentos_repor": 0,
    "pausado_em": null
  }
}
```

**Use cases:**
- Answering "what is X's plan?" for a recurring plan
- Checking the value and validity before renewing or changing

---

### 18. Apply Discount to a Charge

Reduce the value of an existing charge and record the discount in its description.

**Request:**
```
POST {{SEUFISIO_PROXY_URL}}/api/charges/827/discount
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{ "valor_desconto": 50 }
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Charge ID (path) |
| valor_desconto | number | Yes | Amount to take off. Must be > 0 and ≤ the charge value |
| descricao | string | No | Custom note. Omit to use the standard SeuFisio wording |

**Response:**
```json
{
  "success": true,
  "charge": {
    "id": 827,
    "titulo": "Ref. serviço 154 ciclo: 20/08/2026",
    "valor": 150,
    "valor_bruto": 150,
    "descricao": "Valor Original: R$ 200,00\\nAplic. Desc. de R$ 50,00(25,00%), R$ 150,00.",
    "pago": 0
  },
  "valor_original": 200,
  "valor_desconto": 50,
  "valor_final": 150
}
```

**Use cases:**
- The client paid for an evaluation before closing the plan and that credit comes off the
  first charge. **Prefer doing this through `desconto` in section 16**, which finds the
  right charge on its own. Use this endpoint only for a charge the plan flow did not create.

---

## Onboarding APIs

After a plan is sold, the client has to complete their registration and sign two contracts
(Contrato Cliente Pacote and Termo de Consentimento). **The proxy does this on its own**,
on a sweep that runs every 10 minutes:

```
plan created → registration link sent on WhatsApp
             → registration complete? → generates both contracts, sends both links
             → not complete after 48h? → resends the link
             → contracts signed? → done
             → not signed after 48h? → nudges, listing only what is missing
```

The agent's job is to **read** this state and answer questions about it. Never promise to
follow up yourself and never schedule anything: the follow-up already exists.

---

### 19. Get Onboarding Status

Where a client stands in the post-sale flow.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/onboarding/216
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Response:**
```json
{
  "success": true,
  "cliente": { "id": 216, "nome": "Kelwin Sanches Savoia", "telefone": "(11) 97023-1208" },
  "cadastro": {
    "completo": false,
    "campos_faltando": ["data de nascimento", "profissão", "estado civil", "endereço (rua)", "número", "CEP", "bairro", "cidade", "UF"]
  },
  "contratos": [
    { "id": 100, "nome": "Contrato Cliente Pacote", "assinado": true,  "assinado_em": "2026-08-21 17:28:49", "abriu_sem_assinar": false },
    { "id": 101, "nome": "Termo de Consentimento",  "assinado": false, "assinado_em": null, "abriu_sem_assinar": true }
  ],
  "onboarding": [
    { "plano_id": 154, "estado": "contrato_pendente", "link_cadastro_enviado_em": "2026-08-21T20:00:00Z", "tentativas_cadastro": 1, "contratos_enviados_em": "2026-08-21T20:17:00Z", "tentativas_contrato": 1 }
  ]
}
```

**Reading it:**
| Field | Meaning |
|---|---|
| `cadastro.campos_faltando` | Empty = ready for contracts. Otherwise these are the fields the client still has to fill in |
| `contratos[].assinado` | The real signature state |
| `contratos[].abriu_sem_assinar` | Opened the link and gave up halfway — worth mentioning to the user |
| `onboarding[].estado` | `cadastro_pendente` → `contrato_pendente` → `concluido` |
| `onboarding[].tentativas_*` | How many messages have already been sent |

**Use cases:**
- "Did Kelwin sign yet?"
- "Which clients are still missing their registration?"
- Checking why a contract has not been generated (the registration is incomplete)

---

### 20. Resend Onboarding Message

Force the pending message out now, instead of waiting for the 48h window.

**Request:**
```
POST {{SEUFISIO_PROXY_URL}}/api/onboarding/216/resend
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{ "plano_id": 154 }
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clienteId | number | Yes | Client ID (path) |
| plano_id | number | No | Restrict to one plan. Omit to release every pending plan of that client |

**Response:** `{ "success": true, "linhas_liberadas": 1, "sweep": { ... } }`

The message sent depends on the state: the registration link if the registration is still
incomplete, the signature nudge if the contracts are already out.

**Use cases:**
- Right after adding a phone number that was missing at the time of the sale
- The user asks to "send it again now"

---

### 21. Update Customer Phone

Set or fix a client's phone number in SeuFisio.

**Request:**
```
PUT {{SEUFISIO_PROXY_URL}}/api/customers/216
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{ "phone": "(11) 97023-1208" }
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Client ID (path) |
| phone | string | Yes | Phone with DDD. Accepts formatted or digits only |

**Response:** `{ "success": true, "customer": { ... } }`

**Use cases:**
- The plan was created but `onboarding.telefone_ausente` came back `true`: ask the user for
  the number, save it here, then call section 20 to send the link

---

## Sell Recurring Plan Skill — Step-by-Step Flow

When the user wants to sell a plan to a client, follow this flow:

```
1. Find the customer → get clienteId
2. Determine the plan type → 1x, 2x or 3x per week, from GET /api/attendance-types
3. Determine the period → Mensal (1) or Semestral (6)
4. Get the schedule → one day/time per weekly session
5. Assign professionals → check calendar availability for each day/time
6. Ask about prior payment → an evaluation already paid becomes a discount
7. Create the plan → POST /api/plans (confirm first if it returns 409)
8. Report → value, schedule, first charge, and that the registration link was sent
```

---

### Step 1: Find the Customer

```
GET {{SEUFISIO_PROXY_URL}}/api/clients?search=<name>
```

**If multiple results:** ask the user which one.
**If not found:** create the client first (section 10 — Create Customer).

---

### Step 2: Determine the Plan Type

```
GET {{SEUFISIO_PROXY_URL}}/api/attendance-types
```

The plan types are the ones named "Pilates Nx na Semana" (ids 8, 9 and 10 today). The `N`
in the name is how many entries `dias` must have.

If the user did not say the frequency, ask: "1x, 2x or 3x per week?"

---

### Step 3: Determine the Period

Ask if it is **Mensal** or **Semestral** when the user did not say. Send `periodicidade: 1`
or `periodicidade: 6`.

Do not send `possui_data_encerramento` — the default already matches the studio rule
(monthly open-ended, semester with an end date).

Do not quote a price at this point — the proxy derives it and returns it in the response.

---

### Step 4: Get the Schedule

One day and time per weekly session. Days go without accents: `segunda`, `terca`,
`quarta`, `quinta`, `sexta`, `sabado`, `domingo`.

Validate the count against the plan type before calling the API: a "2x na Semana" with 3
days is a mistake worth pointing out, not a request to fulfil.

---

### Step 5: Professionals — Skip It

Nothing to do here. `POST /api/plans` assigns the professional and the room for each day
from the calendar, with the same rule the create-attendance flow uses. Do not query
`/api/calendar` first and do not ask the user who the professional will be — you find out
from the response and report it.

Only send `profissional_id` when the user explicitly asks for a specific professional
("put her with Amanda").

**Do not refuse the sale because a slot looks full.** Overbooking is not checked on plan
creation, by decision of the studio: a full slot comes back as `lotado: true` in `dias`,
which you mention without blocking. A 400 with `problemas` is different — that means nobody
works at that time.

---

### Step 6: Ask About Prior Payment

**This step is mandatory and easy to forget.** Ask:

> "Did the client already pay anything before this plan? An evaluation session, a single
> class?"

If yes, send it as `desconto: { "valor": <amount> }`. It comes off the first charge the
plan generates. R$ 50 for a Sessão Avaliação is the common case.

---

### Step 7: Create the Plan

Call `POST /api/plans` (section 16).

- **201** → done, move to step 8.
- **409** → show `message` and `resumo` to the user, ask whether to proceed, and on
  confirmation repeat the request with `"confirmar": true`.
- **400** → the payload is wrong (invalid day, bad hour format, missing price for that
  period). Read `error` and fix it, do not retry blindly.

---

### Step 8: Report the Result

Tell the user, from the response:
- the plan, the period and the **monthly** value (`plan.valor_mensal`)
- the schedule (`plan.horarios`) and who was assigned to each day (`dias[].profissional_nome`)
- the billing day (`plan.dia_padrao_cobranca`) and the end date (`plan.data_encerramento`)
- the discount, if there was one (`desconto.valor_final` is what the client will pay now)
- that the registration link went out on WhatsApp (`onboarding.mensagem_enviada`)

**If `atendimentos_retroativos` is not null, warn about it in the same message** — do not
bury it and do not omit it. The start date was in the past, so sessions were already
created and counted as done, which changes the client's session balance. List the dates and
ask whether that was the intention. Example wording:

> "Heads up: the plan starts on 20/08, which is before today, so SeuFisio already generated
> 1 retroactive session — quinta 20/08 at 9h — and it is already counted as done. Was that
> what you wanted, or should the plan start today?"

If it was not intended, the fix is manual in SeuFisio: there is no undo through the proxy.

**If `onboarding.telefone_ausente` is `true`**, the client has no phone on file and nothing
was sent. Ask for the number, save it with section 21, then call section 20.

---

## Conversation Examples — Sell Recurring Plan

### Example 1: Full flow with an evaluation credit

**User:** "Sell Kelwin a semester plan, 1x a week, Tuesday and Thursday 9am. He already paid the R$ 50 evaluation."

**Assistant flow:**
1. Search: `GET /api/clients?search=Kelwin` → `{ id: 216 }`
2. Types: `GET /api/attendance-types` → "Pilates 1x na Semana" is id 8
3. **Catch the mismatch:** 1x per week but two days were given. Ask: "Pilates 1x na Semana is one session per week, but you gave me two days. Do you want 2x a week (id 9), or 1x on just one of those days?"
4. User: "2x then"
5. Create (no calendar lookup — the proxy assigns the professionals):
   ```json
   POST /api/plans
   { "cliente_id": 216, "tipo_atendimento_id": 9, "periodicidade": 6,
     "inicio_servico": "2026-08-24",
     "dias": [ { "dia": "terca", "hora": "09:00" },
               { "dia": "quinta", "hora": "09:00" } ],
     "desconto": { "valor": 50 } }
   ```
6. Read `dias` from the response: Tuesday went to Pri Savoia, Thursday to Amanda Mel
7. Respond: "Done! Kelwin is on Pilates 2x na Semana, semester plan, R$ 335/month, Tuesday at 9am with Pri and Thursday at 9am with Amanda. Billing on the 24th, plan runs to 23/02/2027. The first charge came out at R$ 285 with the R$ 50 evaluation credit. I sent him the registration link on WhatsApp — he needs to fill it in before the contracts can be issued."

### Example 2: Schedule warning, needs confirmation

**User:** "Put Adriana on a monthly plan, 1x a week, Wednesday 7pm"

**Assistant flow:**
1. Search and type resolution as above → client 71, tipo 8
2. Create → **409** with `conflito` describing an overlap at that time
3. Ask: "SeuFisio flagged a conflict at 7pm on Wednesday: <message>. Do you want me to create it anyway?"
4. User: "Yes, go ahead"
5. Repeat the same request with `"confirmar": true` → 201
6. Respond with the plan summary

### Example 3: Client with no phone

**User:** "Sell a monthly plan to Maria, Monday 10am"

**Assistant flow:**
1. Create the plan → 201, but `onboarding.telefone_ausente: true`
2. Respond: "The plan is created — Pilates 1x na Semana, monthly, R$ 290/month, Monday 10am. But Maria has no phone on file, so I could not send the registration link. What is her number?"
3. User: "11 98888-7777"
4. `PUT /api/customers/<id>` with `{ "phone": "11 98888-7777" }`
5. `POST /api/onboarding/<id>/resend`
6. Respond: "Saved and sent. She got the registration link on WhatsApp."

### Example 4: Start date in the past

**User:** "Sell João a monthly plan, Monday and Wednesday 8am, starting the 1st of this month"

**Assistant flow:**
1. Search, type and calendar as usual
2. Create with `"inicio_servico": "2026-08-01"` → 201, and the response carries
   `atendimentos_retroativos: { quantidade_prevista: 6, atendimentos_contabilizados: 6, ... }`
3. Respond: "Plan created — Pilates 2x na Semana, monthly, R$ 465/month, Monday and Wednesday at 8am. **Careful:** since it starts on 01/08, SeuFisio generated 6 retroactive sessions (04, 06, 11, 13, 18 and 20/08) and they are already counted as done. If you wanted the plan to start today instead, that has to be fixed directly in SeuFisio. Registration link sent on WhatsApp."

### Example 5: Asking about progress

**User:** "Did Kelwin sign the contracts?"

**Assistant flow:**
1. Search → client 216
2. `GET /api/onboarding/216`
3. Respond from the data: "He signed the Contrato Cliente Pacote on 21/08 at 17:28. The Termo de Consentimento is still open — he opened the link but did not finish signing. The system will nudge him automatically 48h after the last message; want me to send it again now?"

### Example 6: Contracts have not been generated yet

**User:** "Why hasn't Maria's contract come out?"

**Assistant flow:**
1. `GET /api/onboarding/<id>` → `estado: "cadastro_pendente"`, `campos_faltando: ["CPF", "estado civil", "profissão"]`
2. Respond: "Her registration is still incomplete — CPF, estado civil and profissão are missing. The contracts are only generated after that, because the text is filled in with those fields at the moment it is created. She got the link and will get a reminder 48h after the last message. Want me to send it again now?"

---

# Regras de negócio para gravar na skill

Estas valem como instrução direta ao agente:

1. **Nunca calcule nem invente o valor do plano.** O proxy deriva da tabela do studio. O
   valor que você informa ao usuário é o que voltou em `plan.valor_mensal`. Só mande
   `valor_congelado` se o usuário pedir explicitamente um valor customizado.
2. **Semestral é parcela mensal, não valor à vista.** "Semestral, R$ 200/mês" está certo;
   "semestre de R$ 200" está errado.
3. **Sempre pergunte se houve pagamento anterior** antes de criar o plano. É o passo mais
   fácil de esquecer e o que gera retrabalho financeiro.
4. **Não valide superlotação** e não recuse venda por horário cheio. Decisão do studio.
5. **409 nunca é erro final.** É pedido de confirmação. Mostre a mensagem, pergunte,
   repita com `confirmar: true`.
6. **Não prometa acompanhar nada.** Não diga "vou te avisar quando ele assinar", não crie
   lembrete, não agende verificação. O cron do proxy já faz o follow-up a cada 10 minutos e
   cobra a cada 48h. Se perguntarem, consulte na hora.
7. **Contrato só sai com cadastro completo**, e isso inclui **estado civil** (que só o
   Termo de Consentimento usa). O texto do contrato é um retrato do momento da criação: se
   sair com o cadastro pela metade, fica com buracos para sempre.
8. **Data de início no passado exige aviso explícito, para o operador.** Se
   `atendimentos_retroativos` vier preenchido, diga na conversa quantas aulas foram geradas
   e em que datas, e pergunte se era isso. Elas já contam como feitas e mexem no saldo do
   cliente. Não dá para desfazer pelo proxy. Esse aviso **nunca** vai para o cliente: as
   mensagens de WhatsApp são só link de cadastro, contratos e cobrança de assinatura.
9. **Não escolha profissional e não consulte o calendário antes de criar plano.** O proxy
   resolve pela agenda, com a mesma regra da criação de sessão. Você descobre quem ficou
   com cada dia pela resposta. Só mande `profissional_id` se o usuário pedir alguém
   específico.
10. **Mensal não tem data de encerramento e não trava preço.** Semestral tem prazo e trava.
   O proxy já aplica isso pelo `periodicidade`; não mande `possui_data_encerramento`.
11. **`aceitou` não é assinatura.** Se algum dia você olhar o dado bruto do contrato, o
   campo que vale é `data_hora_assinatura`. O `aceitou` vem `1` desde a criação.

---

# Pendências conhecidas

Vale registrar na skill como limitação, para o agente não tropeçar:

- **`GET /api/plans/recurring/:id` exige `cliente_id`** porque lê da lista de vendas do
  cliente. Se um dia capturarmos a tela de detalhe do plano recorrente, isso deixa de ser
  necessário.
- **Cobrança automática no cartão** está fora de escopo (V2). Todo plano criado agora sai
  com `cobranca_automatica: false`.
- **Planos sem dias fixos** não são usados pelo studio e não estão suportados.
- Se você quiser que o agente **informe o preço antes de criar** o plano, o
  `GET /api/attendance-types` hoje só devolve `valor_mensal` — faltaria expor as colunas
  das outras periodicidades. Hoje o preço é confirmado depois, pela resposta da criação.
