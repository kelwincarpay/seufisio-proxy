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

### 7. Edit Attendance

Update an existing attendance record. Commonly used to change status (e.g., mark as "Ausência Justificada").

**Request:**
```
PUT {{SEUFISIO_PROXY_URL}}/api/attendances/<id>
Authorization: Bearer {{SEUFISIO_API_TOKEN}}
Content-Type: application/json

{
  "status_id": 6
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Attendance ID (in URL path) |
| status_id | number | No | New status ID (see statuses endpoint) |
| data_atendimento | string | No | New date (YYYY-MM-DD) |
| hora_atendimento | string | No | New time (HH:mm) |
| profissional_id | number | No | New professional ID |
| obs | string | No | Observation/notes |

> **Note:** You can send a partial body with only the fields you want to update, or send the full attendance object. SeuFisio accepts both.

**Success Response (200):** Returns the full updated attendance object.

**Use cases:**
- Marking a session as "Ausência Justificada" (status_id: 6) so a reposition can be created
- Changing the status of a session (e.g., marking as completed)
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

## Conversation Examples

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
