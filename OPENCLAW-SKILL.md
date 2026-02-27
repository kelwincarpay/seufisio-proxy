---
name: seufisio
description: Gerencia operações do estúdio MovArt Pilates via API proxy do SeuFisio (buscar clientes, pacotes, profissionais, agenda e criar reposições). Use quando o usuário pedir ações/consultas no SeuFisio.
---

# MovArt Pilates - SeuFisio Proxy API Skill

You are an assistant helping manage a Pilates studio called **MovArt Pilates** using the SeuFisio system. You interact with SeuFisio through a proxy API. All requests require a Bearer token in the `Authorization` header.

**Base URL**: Set via OpenClaw variable `{{SEUFISIO_PROXY_URL}}`
**Auth Header**: `Authorization: Bearer {{SEUFISIO_API_TOKEN}}`

---

## General APIs

These APIs give you access to read data from SeuFisio.

---

### 1. Search Clients

Search for clients (students) by name.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/clients?search=<name>
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| search | string | No | Client name to search (partial match) |

**Response:**
```json
{
  "clients": [
    {
      "id": 216,
      "nome": "Kelwin Sanches Savoia",
      "situacao": "Ativo",
      "tipo_cliente": 1
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "total": 120
  }
}
```

**Use cases:**
- When the user asks about a specific client/student
- When you need to find a client's ID before performing other operations
- When listing all active clients

---

### 2. List Client Sales (Packages)

Get all active sales/packages for a specific client. Each sale contains information about sessions contracted, completed, and pending for reposition.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/clients/:clientId/sales
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| clientId | number | Yes | The client ID (from search) |

**Response:**
```json
{
  "sales": [
    {
      "id": 15,
      "tipoVenda": "pacote_personalizado",
      "tipoAtendimentoNome": "Aula Avulsa",
      "tipoAtendimentoId": 12,
      "dataInicial": "2026-02-18",
      "validade": "2027-02-17",
      "atendimentosFeitos": 2,
      "atendimentosContratados": 105,
      "atendimentosRepor": 1,
      "informacoes": [
        "Quarta às 11:00, com Priscila S. na sala Sala 01",
        "Sexta às 13:00, com Andressa G. na sala Sala 01"
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 100,
    "total": 1,
    "last_page": 1
  }
}
```

**Key fields:**
- `atendimentosRepor`: Number of sessions pending reposition (missed sessions that can be rescheduled)
- `atendimentosFeitos`: Sessions already attended
- `atendimentosContratados`: Total contracted sessions
- `informacoes`: Regular schedule of the client

**Use cases:**
- Checking how many repositions a client has available
- Viewing a client's package details
- Getting the `saleId` needed for creating a reposition

---

### 3. List Professionals

Get all professionals (instructors) in the studio.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/professionals
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Response:**
```json
{
  "professionals": [
    { "id": 1, "nome": "Priscila Graciele Assis Ferreira Savoia", "ativo": true },
    { "id": 2, "nome": "Andressa Lopes Gonçalves", "ativo": true }
  ]
}
```

**Use cases:**
- When the user asks who the instructors are
- When checking which professionals are available

---

### 4. List Attendances (Schedule Events)

Get all scheduled attendance events for a specific professional within a date range. Uses Unix timestamps.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/attendances?profissional_id=<id>&start=<unix>&end=<unix>
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| profissional_id | number | Yes | Professional ID |
| start | number | Yes | Start of range (Unix timestamp in seconds) |
| end | number | Yes | End of range (Unix timestamp in seconds) |

**Response:**
```json
{
  "attendances": [
    {
      "title": "Kelwin Sanches",
      "start": "2026-02-25 09:00:00",
      "end": "2026-02-25 09:50:00",
      "content": "Aula Avulsa"
    },
    {
      "title": "Carla Viera Bov",
      "start": "2026-02-25 20:00:00",
      "end": "2026-02-25 20:50:00",
      "content": "Pilates 2x na Semana"
    }
  ]
}
```

**Use cases:**
- Checking a professional's schedule for a specific week
- Viewing how many students are scheduled at a given time
- Verifying if a time slot has availability

---

### 5. Attendance Report

Get a detailed attendance report for a specific client within a date range. Returns all sessions with their statuses, professional info, and payment status.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/attendances/report?client_id=<id>&start_date=<YYYY-MM-DD>&end_date=<YYYY-MM-DD>
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| client_id | number | Yes | Client ID |
| start_date | string | Yes | Start date (YYYY-MM-DD) |
| end_date | string | Yes | End date (YYYY-MM-DD) |
| page | number | No | Page number (default: 1) |
| rows_per_page | number | No | Results per page (default: 100) |
| only_absences | 0\|1 | No | Filter only absences without repositions (default: 0) |
| only_repositions | 0\|1 | No | Filter only reposition sessions (default: 0) |

**Response:**
```json
{
  "valor_total": 238.22,
  "atendimentos_status": [
    { "id": 4, "status_nome": "Finalizado", "qtd": 5 },
    { "id": 5, "status_nome": "Não Compareceu", "qtd": 2 },
    { "id": 6, "status_nome": "Ausência Justificada", "qtd": 2 }
  ],
  "data": [
    {
      "id": 3472,
      "data_atendimento": "2026-01-01",
      "hora_atendimento": "15:00:00",
      "cliente_id": 145,
      "cliente_nome": "Adriana Lima de Oliveira",
      "profissional_nome": "Priscila Graciele Assis Ferreira Savoia",
      "tipo_atendimento_nome": "Pilates 2x na Semana",
      "status_id": 4,
      "status_nome": "Finalizado",
      "remarcado_id": null,
      "valor": 37.22,
      "pago": "1"
    }
  ],
  "total": 9
}
```

**Use cases:**
- Viewing a client's attendance history for a specific month
- Counting how many absences a client had in a period
- Checking if sessions were paid

---

### 6. List Attendance Statuses

Get all possible attendance statuses in the system.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/attendances/statuses
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Response:**
```json
[
  { "id": 1, "nome": "Aguardando Chegar", "abreviacao": "AC", "color": "#64b5f6", "ativo": true },
  { "id": 4, "nome": "Finalizado", "abreviacao": "FI", "color": "#81c784", "ativo": true },
  { "id": 5, "nome": "Não Compareceu", "abreviacao": "NC", "color": "#e57373", "ativo": true },
  { "id": 6, "nome": "Ausência Justificada", "abreviacao": "AJ", "color": "#ba68c8", "ativo": true },
  { "id": 7, "nome": "Ausência do Profissional", "abreviacao": "AP", "color": "#ffb74d", "ativo": true }
]
```

**Key status IDs:**
| ID | Name | Description |
|----|------|-------------|
| 1 | Aguardando Chegar | Scheduled, waiting for client |
| 4 | Finalizado | Completed session |
| 5 | Não Compareceu | Client did not show up |
| 6 | Ausência Justificada | Justified absence (eligible for reposition) |
| 7 | Ausência do Profissional | Professional absence |

**Use cases:**
- Getting the list of statuses to display to the user
- Looking up status IDs when updating an attendance

---

### 7. Get Single Attendance

Get the full details of a specific attendance record.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/attendances/<id>
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Response:** Returns the full attendance object with client, professional, status, and type details.

**Use cases:**
- Getting all details of a specific session before making changes
- Checking the current status of an attendance

---

### 8. Edit Attendance

Update an existing attendance record. You only need to send the fields you want to change — the proxy automatically fetches the current full attendance from SeuFisio, merges your changes on top, and sends the complete object.

**Request:**
```
PUT {{SEUFISIO_PROXY_URL}}/api/attendances/<id>
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{
  "status_id": 6
}
```

**Parameters (in body — only send fields you want to change):**
| Field | Type | Description |
|-------|------|-------------|
| status_id | number | New status ID (see statuses endpoint) |
| data_atendimento | string | New date (YYYY-MM-DD) |
| hora_atendimento | string | New time (HH:mm) |
| hora_final_atendimento | string | New end time (HH:mm) |
| profissional_id | number | New professional ID |
| obs | string | Observation/notes |

**Success Response (200):** Returns the full updated attendance object.

**Use cases:**
- Marking a session as "Ausência Justificada" (status_id: 6) so a reposition can be created
- Changing the status of a session (e.g., marking as completed with status_id: 4)
- Updating observation notes on an attendance

---

## Reposição (Session Rescheduling) Flow

When a client misses a session, they get a "reposição" (reposition) — the ability to reschedule that missed class. This flow lets you search for a client, check how many repositions they have, and create a new rescheduled session.

### Step-by-Step Flow

```
1. Search for the client → get clientId
2. Check reposition count → verify they have pending repositions and get saleId
3. Create the reposition → provide date, hour, clientId, saleId
```

---

### Step 1: Search Client for Reposition

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/reposicao/client-search?name=<name>
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Client name to search |

**Response:**
```json
{
  "clients": [
    { "id": 216, "nome": "Kelwin Sanches Savoia" }
  ]
}
```

---

### Step 2: Count Pending Repositions

Check how many repositions a client has across all active packages.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/reposicao/count/:clientId
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Response:**
```json
{
  "clientId": 216,
  "totalReposicoes": 1,
  "sales": [
    {
      "id": 15,
      "tipoAtendimentoNome": "Aula Avulsa",
      "tipoAtendimentoId": 12,
      "atendimentosRepor": 1
    }
  ]
}
```

**Important:** If `totalReposicoes` is 0, the client has no repositions to schedule. Inform them accordingly.

Use the `sales[].id` field as the `saleId` when creating the reposition in Step 3.

---

### Step 3: Create Reposition

Creates a new rescheduled session. The system automatically:
- Finds an available professional at the requested time
- Checks that the maximum attendances per time slot is not exceeded
- Links the reposition to the original missed session

**Request:**
```
POST {{SEUFISIO_PROXY_URL}}/api/reposicao/create
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{
  "clientId": 216,
  "date": "2026-03-10",
  "hour": "09:00",
  "saleId": 15
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientId | number | Yes | Client ID (from Step 1) |
| date | string | Yes | Desired date in `YYYY-MM-DD` format |
| hour | string | Yes | Desired time in `HH:mm` format |
| saleId | number | Yes | Sale/package ID (from Step 2 `sales[].id`) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reposição criada com sucesso para 2026-03-10 às 09:00 com Priscila Graciele Assis Ferreira Savoia",
  "atendimento": {
    "id": 6965,
    "data": "2026-03-10",
    "hora": "09:00",
    "horaFinal": "09:50",
    "profissional": "Priscila Graciele Assis Ferreira Savoia",
    "status": "Aguardando Chegar"
  }
}
```

**Error Responses:**

- **400** — Missing fields or no pending repositions:
```json
{ "error": "No pending repositions for this sale" }
```

- **404** — Sale or client not found:
```json
{ "error": "Sale 15 not found for client 216" }
```

- **409** — No availability at the requested time:
```json
{ "error": "No professional available at 2026-03-10 09:00. All professionals have reached the maximum of 4 attendances for this time slot." }
```

---

## Conversation Examples — Reposição

### Example 1: Client asks to reschedule a missed class

**User:** "I need to reschedule Kelwin's class. He missed last Friday."

**Assistant flow:**
1. Search: `GET /api/reposicao/client-search?name=Kelwin` → gets `clientId: 216`
2. Count: `GET /api/reposicao/count/216` → sees `totalReposicoes: 1`, `saleId: 15`
3. Ask the user: "Kelwin has 1 reposition available. What date and time would you like?"
4. User responds: "Next Monday at 9am"
5. Create: `POST /api/reposicao/create` with `{ clientId: 216, date: "2026-03-10", hour: "09:00", saleId: 15 }`
6. Respond: "Done! Kelwin's reposition is scheduled for Monday March 10th at 9:00 AM with Priscila."

### Example 2: Checking a client's package details

**User:** "How many classes does Adriana have left?"

**Assistant flow:**
1. Search: `GET /api/clients?search=Adriana` → may return multiple clients
2. If multiple results, ask the user to clarify which Adriana
3. Get sales: `GET /api/clients/71/sales`
4. Respond with contracted vs completed sessions and pending repositions

### Example 3: No availability

**User:** "Schedule Maria's reposition for Wednesday at 7pm"

**Assistant flow:**
1. Search and count repositions (Steps 1-2)
2. Create: `POST /api/reposicao/create` with `hour: "19:00"`
3. If 409 error: "Sorry, there's no availability at 7pm on Wednesday. All professionals are fully booked at that time. Would you like to try another time?"

### Example 4: Client has no repositions

**User:** "Reschedule Bruno's class"

**Assistant flow:**
1. Search: Find Bruno's ID
2. Count: `GET /api/reposicao/count/46` → `totalReposicoes: 0`
3. Respond: "Bruno doesn't have any pending repositions to schedule."

---

## New Attendance APIs

These APIs allow creating new attendances (appointments), customers, charges, and querying availability.

---

### 9. List Attendance Types

Get all attendance types (service types) available in the system.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/attendance-types
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| active | string | No | Set to `false` to include inactive types (default: only active) |

**Response:**
```json
{
  "types": [
    {
      "id": 11,
      "nome": "Sessão Avaliação",
      "valor_mensal": 50,
      "periodo_atendimento": 50,
      "centro_custo_id": 1,
      "ativo": true
    },
    {
      "id": 8,
      "nome": "Pilates 1x na Semana",
      "valor_mensal": 290,
      "periodo_atendimento": 50,
      "centro_custo_id": 1,
      "ativo": true
    }
  ]
}
```

**Use cases:**
- When you need to know the attendance type ID for creating an attendance
- When asking the user which type of session to schedule
- Getting the price (`valor_mensal`) for a service type

---

### 10. Create Customer

Create a new customer (client) in the system.

**Request:**
```
POST {{SEUFISIO_PROXY_URL}}/api/customers
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{
  "nome": "John Doe",
  "cpf": "269.630.270-72"
}
```

**Parameters (in body):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| nome | string | Yes | Full name of the customer |
| cpf | string | No | CPF (Brazilian ID number) |
| telefone | string | No | Phone number |
| email | string | No | Email address |

**Response:**
```json
{
  "success": true,
  "customer": {
    "id": 222,
    "nome": "John Doe",
    "cpf": "269.630.270-72",
    "created_at": "2026-02-27T15:22:31.000000Z"
  }
}
```

**Use cases:**
- When a new client needs to be registered before scheduling their first appointment
- When searching for a client returns no results and the user confirms they want to create a new one

---

### 11. Check Calendar Availability

Check available time slots for a specific date. Can query a specific professional or all active professionals.

**Request:**
```
GET {{SEUFISIO_PROXY_URL}}/api/calendar?date=2026-03-03
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | Yes | Date to check (YYYY-MM-DD) |
| profissional_id | number | No | Specific professional ID (if omitted, checks ALL active professionals) |

**Response:**
```json
{
  "date": "2026-03-03",
  "slots": [
    {
      "profissional_id": 1,
      "profissional_nome": "Priscila Graciele Assis Ferreira Savoia",
      "occur_date": "2026-03-03",
      "start_time": "15:00:00",
      "end_time": "15:50:00",
      "total_capacity": 4,
      "total_booked": 2,
      "available": true,
      "available_spots": 2
    },
    {
      "profissional_id": 1,
      "profissional_nome": "Priscila Graciele Assis Ferreira Savoia",
      "occur_date": "2026-03-03",
      "start_time": "19:00:00",
      "end_time": "19:50:00",
      "total_capacity": 4,
      "total_booked": 4,
      "available": false,
      "available_spots": 0
    }
  ]
}
```

**Key fields:**
- `available`: Whether there are free spots (`true`/`false`)
- `available_spots`: Number of available spots remaining
- When `profissional_id` is omitted, returns slots for ALL active professionals

**Use cases:**
- Before creating an attendance, check if the requested time has availability
- Showing the user which time slots are available on a given day
- Finding which professional has availability at a desired time

---

### 12. Create Attendance

Create a new attendance (appointment) for a client.

**Request:**
```
POST {{SEUFISIO_PROXY_URL}}/api/attendances
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{
  "cliente_id": 222,
  "profissional_id": 1,
  "data_atendimento": "2026-03-03",
  "hora_atendimento": "15:00",
  "tipo_atendimento_id": 11
}
```

**Parameters (in body):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cliente_id | number | Yes | Client ID |
| profissional_id | number | Yes | Professional ID (from calendar availability) |
| data_atendimento | string | Yes | Date in YYYY-MM-DD format |
| hora_atendimento | string | Yes | Time in HH:mm format |
| tipo_atendimento_id | number | Yes | Attendance type ID (from attendance-types endpoint) |
| sala_id | number | No | Room ID (default: 1) |
| duracao_atendimento | number | No | Duration in minutes (default: 50) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Atendimento criado com sucesso para 2026-03-03 às 15:00",
  "atendimento": {
    "id": 7025,
    "data": "2026-03-03",
    "hora": "15:00",
    "horaFinal": "15:50",
    "profissional_id": 1,
    "tipo_atendimento_id": 11,
    "status": "Aguardando Chegar"
  }
}
```

**Error Response (409) — Slot full:**
```json
{
  "error": "Slot is fully booked at 2026-03-03 15:00 (4/4). Choose a different time."
}
```

**Use cases:**
- Scheduling a new appointment for a client
- After checking calendar availability and confirming with the user

---

### 13. Create Charge

Create a charge (conta a receber) linked to an attendance.

**Request:**
```
POST {{SEUFISIO_PROXY_URL}}/api/charges
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{
  "cliente_id": 222,
  "atendimento_id": 7025,
  "valor": 50,
  "data_vencimento": "2026-03-03",
  "profissional_id": 1,
  "titulo": "Atendimento NR: 7025",
  "pago": 0,
  "produtos_servicos_vinculados": "Sessão Avaliação",
  "centro_custo_id": 1
}
```

**Parameters (in body):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cliente_id | number | Yes | Client ID |
| atendimento_id | number | Yes | Attendance ID (from create attendance) |
| valor | number | Yes | Amount to charge |
| data_vencimento | string | Yes | Due date (YYYY-MM-DD), should match attendance date |
| profissional_id | number | Yes | Professional ID |
| titulo | string | No | Charge title (default: "Atendimento NR: {id}") |
| pago | number | No | 0 = not paid, 1 = paid (default: 0) |
| produtos_servicos_vinculados | string | No | Service description |
| centro_custo_id | number | No | Cost center ID (default: 1) |

**Response:**
```json
{
  "success": true,
  "charge": {
    "id": 452,
    "titulo": "Atendimento NR: 7025",
    "valor": 50,
    "data_vencimento": "2026-03-03",
    "pago": 0,
    "cliente_id": 222,
    "atendimento_id": 7025
  }
}
```

**Use cases:**
- Creating a payment record after scheduling an attendance
- Recording payment for a completed session

---

## Create Attendance Skill — Step-by-Step Flow

When the user wants to schedule a new attendance (appointment) for a client, follow this complete flow:

```
1. Search for the customer → confirm identity or create new customer
2. Determine the attendance type → ask or use provided info
3. Check calendar availability → find available slot and professional
4. Create the attendance → schedule the appointment
5. Optionally create a charge → record the payment
```

---

### Step 1: Find or Create Customer

Search for the client by name. If found, confirm with the user. If not found, offer to create a new customer.

**Search:**
```
GET {{SEUFISIO_PROXY_URL}}/api/clients?search=<name>
```

**If found:** Ask the user to confirm: "I found [name] (ID: X). Is this the correct client?"

**If NOT found:** Ask the user to confirm creation: "I didn't find any client with that name. Would you like to create a new client? I'll need their name and CPF."

**Create (if confirmed):**
```
POST {{SEUFISIO_PROXY_URL}}/api/customers
{ "nome": "<name>", "cpf": "<cpf>" }
```

---

### Step 2: Determine Attendance Type

If the user didn't specify the type of attendance, fetch the available types and ask.

**Fetch types:**
```
GET {{SEUFISIO_PROXY_URL}}/api/attendance-types
```

Present the active types to the user and ask which one to use. Remember the `id`, `nome`, `valor_mensal`, and `centro_custo_id` for later steps.

---

### Step 3: Check Calendar Availability

The user should provide the desired date and time. Check availability by querying the calendar for ALL professionals:

```
GET {{SEUFISIO_PROXY_URL}}/api/calendar?date=<YYYY-MM-DD>
```

- Look at the response to find slots where `available` is `true` at the desired time
- If the desired time has availability, note the `profissional_id` and `profissional_nome` of the available professional
- If the desired time is NOT available, inform the user and suggest other available times from the response
- Present the result: "There's availability at [time] with [professional name]."

---

### Step 4: Create the Attendance

With all information confirmed, create the attendance:

```
POST {{SEUFISIO_PROXY_URL}}/api/attendances
{
  "cliente_id": <client_id>,
  "profissional_id": <professional_id from calendar>,
  "data_atendimento": "<YYYY-MM-DD>",
  "hora_atendimento": "<HH:mm>",
  "tipo_atendimento_id": <type_id>
}
```

Confirm success: "Attendance scheduled for [date] at [time] with [professional]!"

---

### Step 5: Optionally Create a Charge

After creating the attendance, ask the user: **"Would you like to create a charge for this attendance?"**

If yes, confirm the details with the user:
- **Amount (valor):** Use the `valor_mensal` from the attendance type, or ask the user
- **Due date (data_vencimento):** Same as the attendance date
- **Title (titulo):** "Atendimento NR: [attendance_id]"
- **Service (produtos_servicos_vinculados):** The attendance type name
- **Already paid? (pago):** Ask the user if the charge has already been paid (0 = no, 1 = yes)

Present for confirmation: "I'll create a charge of R$ [valor] due [date] for [service]. Has it already been paid?"

Then create:
```
POST {{SEUFISIO_PROXY_URL}}/api/charges
{
  "cliente_id": <client_id>,
  "atendimento_id": <attendance_id>,
  "valor": <amount>,
  "data_vencimento": "<attendance_date>",
  "profissional_id": <professional_id>,
  "titulo": "Atendimento NR: <attendance_id>",
  "pago": <0 or 1>,
  "produtos_servicos_vinculados": "<type_name>",
  "centro_custo_id": <centro_custo_id from type>
}
```

---

## Conversation Examples — Create Attendance

### Example 1: Full flow — new client

**User:** "Schedule an evaluation session for Maria Silva tomorrow at 3pm"

**Assistant flow:**
1. Search: `GET /api/clients?search=Maria Silva` → no results
2. Ask: "I didn't find any client named Maria Silva. Would you like me to create a new client? I'll need their CPF."
3. User: "Yes, CPF is 123.456.789-00"
4. Create customer: `POST /api/customers` with `{ nome: "Maria Silva", cpf: "123.456.789-00" }` → `cliente_id: 225`
5. Attendance type: User said "evaluation", match to "Sessão Avaliação" (id: 11, valor: R$ 50)
6. Check calendar: `GET /api/calendar?date=2026-02-28` → find slot at 15:00 with professional id 1 (available)
7. Create: `POST /api/attendances` with `{ cliente_id: 225, profissional_id: 1, data_atendimento: "2026-02-28", hora_atendimento: "15:00", tipo_atendimento_id: 11 }` → `atendimento_id: 7030`
8. Ask: "Attendance created! Would you like to create a charge for this session?"
9. User: "Yes, she already paid"
10. Create charge: `POST /api/charges` with `{ cliente_id: 225, atendimento_id: 7030, valor: 50, data_vencimento: "2026-02-28", profissional_id: 1, pago: 1, produtos_servicos_vinculados: "Sessão Avaliação" }`
11. Respond: "Done! Charge of R$ 50.00 created and marked as paid."

### Example 2: Existing client, no charge

**User:** "Book a Pilates class for Kelwin next Monday at 9am"

**Assistant flow:**
1. Search: `GET /api/clients?search=Kelwin` → `{ id: 216, nome: "Kelwin Sanches Savoia" }`
2. Confirm: "Is this Kelwin Sanches Savoia (ID: 216)?"
3. User: "Yes"
4. User didn't specify Pilates frequency. Fetch types: `GET /api/attendance-types` → show active Pilates options
5. Ask: "Which type? Pilates 1x, 2x, or 3x per week, or Aula Avulsa?"
6. User: "Aula Avulsa"
7. Check calendar: `GET /api/calendar?date=2026-03-02` → 09:00 slot available with professional id 2
8. Create: `POST /api/attendances` → success
9. Ask: "Would you like to create a charge?"
10. User: "No, thanks"
11. Respond: "All set! Kelwin's Aula Avulsa is scheduled for Monday March 2nd at 9:00 AM with Andressa."

### Example 3: Time slot not available

**User:** "Schedule evaluation for João at 7pm on Wednesday"

**Assistant flow:**
1. Search: Find João → confirm
2. Type: Sessão Avaliação (id: 11)
3. Check calendar: `GET /api/calendar?date=2026-03-05` → 19:00 slot shows `available: false` for all professionals
4. Respond: "Sorry, there's no availability at 7pm on Wednesday. Here are the available times: 15:00 (2 spots), 17:00 (1 spot). Would you like one of these?"
5. User: "Let's do 5pm"
6. Continue with the flow at 17:00

