# Online Booking Flow — Website Integration Spec

How the MovArt website books Pilates spots through the **SeuFisio Proxy** (this repo).

**Goal:** progressively stop accepting aggregator apps (Wellhub / Totalpass) for *new* clients.
Instead, a patient goes to our site, identifies by CPF, sees the agenda of available spots
(professional + time), books a spot, and the proxy creates the attendance in SeuFisio — tagged
**Totalpass** or **Sessão Avulsa (Wellhub)**. A booking can be cancelled only when the class is
**more than 8 hours away**.

> The website never talks to SeuFisio directly. It talks only to this proxy.

---

## 1. Connection & auth

| | |
|---|---|
| Base URL | `https://<proxy-host>` (e.g. `http://localhost:3000` in dev) |
| Auth | Every `/api/*` request needs `Authorization: Bearer <API_SECRET_TOKEN>` |
| Content type | `application/json` for POST/PUT bodies |
| Health check | `GET /health` (no auth) → `{ "status": "ok", "timestamp": "..." }` |

Auth errors:
- `401` — missing `Authorization` header, or not `Bearer <token>` format.
- `403` — token present but wrong.

> The secret token is a **server-side** value. Do NOT ship it in browser JS. The website
> **backend** should call the proxy; the browser calls the website backend. Never expose the token
> to the client.

---

## 2. End-to-end flow

```
1. Patient enters CPF
      └── GET /api/customers?cpf=...
            ├── 200 → client found  → go to step 3
            └── 404 → not registered → step 2

2. (New patient) collect name/phone/email, register
      └── POST /api/customers  → returns new client id

3. Show the agenda for a chosen date
      └── GET /api/calendar?date=YYYY-MM-DD
            → list of slots (professional, time, available spots)

4. Patient picks a slot + confirms source (totalpass | wellhub)
      └── POST /api/attendances  (with cliente_id, slot info, source)
            → attendance created in SeuFisio

5. (Later) Patient views bookings and may cancel
      ├── GET /api/attendances/client/:clientId       (normalized list + cancellable flag)
      └── POST /api/attendances/:id/cancel
            ├── 200 → cancelled
            └── 422 → inside the 8h window, not allowed
```

---

## 3. Business rules (must be enforced)

1. **Source → attendance type** (resolved by the proxy):
   - `totalpass` → `tipo_atendimento_id = 13` ("Totalpass")
   - `wellhub`   → `tipo_atendimento_id = 12` ("Sessão Avulsa")
   The website sends `source`, not the numeric id.
2. **8-hour cancellation window**: cancel is allowed only if the class starts **≥ 8h** from now,
   measured in **studio local time (America/São Paulo, UTC−3)**. The proxy enforces this and
   returns `422` otherwise — but the site should also hide/disable the cancel button inside the
   window for good UX.
3. **New clients cannot come from the apps.** Existing app clients keep using the apps directly;
   this site flow is how *new* app-style bookings happen. **This gate is the website's
   responsibility** — the proxy does not currently reject by client age. If you need a hard
   server-side block, ask backend to add it.
4. **50-minute sessions.** Duration defaults to 50 min; end time is auto-calculated.

---

## 4. Endpoints

### 4.1 Look up a patient by CPF

```
GET /api/customers?cpf=<cpf>
```

- `cpf` — required. Accepts the formatted form `431.474.308-55` (as used by SeuFisio).
- Searches **active** clients only.

**200 — found**
```json
{
  "client": {
    "id": 123,
    "nome": "Maria Silva",
    "cpf": "431.474.308-55",
    "email": "maria@x.com",
    "telefone": "11999998888",
    "data_nascimento": "1990-05-12",
    "situacao": "Ativo",
    "tipo_cliente": 2,
    "gympass_token": null,
    "total_pass_token": null
  },
  "matches": [ { "...": "same shape, one per match" } ]
}
```
Use `client.id` as `cliente_id` in later steps. The CPF filter response itself only returns
`id`/`nome`, so the proxy enriches each match with the **full client detail**
(`GET /api/cliente/:id`) to fill in `cpf`, `email`, `telefone`, etc. `matches` holds any additional
hits (rare) for disambiguation. Fields the client hasn't filled in come back as `""` (or `null` for
`data_nascimento`).

**`gympass_token` / `total_pass_token`** come from the detail record and indicate whether the
patient is linked to an aggregator app: `gympass_token` non-null → **Gympass/Wellhub** member,
`total_pass_token` non-null → **Totalpass** member. Both `null` → no app link. The site can use
these to pre-select the booking `source` (or to decide who is an existing app client).

**404 — not found** → send the patient to registration (4.2)
```json
{ "error": "No active client found for this CPF", "cpf": "431.474.308-55" }
```

Errors: `400` (missing `cpf`), `500` (upstream failure).

---

### 4.2 Register a new patient

```
POST /api/customers
```

```json
{
  "nome": "Maria Silva",      // required
  "cpf": "431.474.308-55",    // optional but strongly recommended (needed for future CPF login)
  "telefone": "11999998888",  // optional
  "email": "maria@x.com"      // optional
}
```

**200**
```json
{
  "success": true,
  "customer": { "id": 456, "nome": "Maria Silva", "cpf": "431.474.308-55", "created_at": "..." }
}
```
Then continue the flow using `customer.id` as `cliente_id`.

Errors: `400` (missing `nome`), `500`.

---

### 4.3 Get the agenda (available spots) for a date

```
GET /api/calendar?date=YYYY-MM-DD[&profissional_id=<id>]
```

- `date` — required.
- `profissional_id` — optional. If omitted, returns slots for **all active professionals**.

**200**
```json
{
  "date": "2026-07-10",
  "slots": [
    {
      "slot_id": 9001,
      "grupo_id": 42,
      "profissional_id": 7,
      "profissional_nome": "João Prof",
      "occur_date": "2026-07-10",
      "start_time": "08:00:00",
      "end_time": "08:50:00",
      "total_capacity": 4,
      "total_booked": 2,
      "available": true,
      "available_spots": 2
    }
  ]
}
```

Rendering guidance:
- Show only slots where `available === true` (or grey out full ones showing `total_booked/total_capacity`).
- Group by `profissional_nome` and/or `start_time` as the UI prefers.
- Keep `profissional_id` and `start_time` — you need them to book.

Errors: `400` (missing `date`), `500`.

---

### 4.4 Book a spot (create attendance)

```
POST /api/attendances
```

```json
{
  "cliente_id": 123,                 // required — from CPF lookup / registration
  "profissional_id": 7,              // required — from the chosen slot
  "data_atendimento": "2026-07-10",  // required — YYYY-MM-DD
  "hora_atendimento": "08:00",       // required — HH:mm (from slot start_time)
  "source": "totalpass",             // "totalpass" | "wellhub"  (proxy maps to the type)
  "sala_id": 1,                      // optional (default 1)
  "duracao_atendimento": 50          // optional (default 50)
}
```

- Provide **either** `source` **or** `tipo_atendimento_id` directly. Prefer `source` — the proxy
  resolves it (`totalpass`→13, `wellhub`→12) so the rule stays server-side.
- The proxy validates slot availability before creating; if the slot is full it returns `409`.

**200**
```json
{
  "success": true,
  "message": "Atendimento criado com sucesso para 2026-07-10 às 08:00",
  "atendimento": {
    "id": 55123,
    "data": "2026-07-10",
    "hora": "08:00",
    "horaFinal": "08:50",
    "profissional_id": 7,
    "tipo_atendimento_id": 13,
    "status": "Aguardando Chegar"
  }
}
```
Store `atendimento.id` — it's needed to cancel.

Errors:
- `400` — missing required field, or neither `source` nor `tipo_atendimento_id` given, or unknown `source`.
- `409` — slot fully booked (`total_booked >= total_capacity`). Ask the patient to pick another time.
- `500` — upstream failure (details echoed in `details`).

---

### 4.5 List a patient's bookings ("meus agendamentos")

**Preferred — normalized, cancel-ready:**
```
GET /api/attendances/client/:clientId
```
Query params (all optional):
- `from` — `YYYY-MM-DD`, default **today** (studio time)
- `to` — `YYYY-MM-DD`, default `from + 60 days`
- `upcoming` — `1` (default) returns only future classes; `0` returns all in range

**200**
```json
{
  "client_id": 216,
  "from": "2026-07-02",
  "to": "2026-08-31",
  "upcoming_only": true,
  "count": 2,
  "attendances": [
    {
      "id": 6965,
      "data_atendimento": "2026-07-10",
      "hora_atendimento": "08:00",
      "profissional_id": 7,
      "profissional_nome": "João Prof",
      "tipo_atendimento_id": 13,
      "tipo_nome": "Totalpass",
      "status_id": 1,
      "status_nome": "Aguardando Chegar",
      "hours_until_class": 26.5,
      "cancellable": true
    }
  ]
}
```
- Sorted chronologically.
- `cancellable` = class is at least 8h away → use it to enable/disable the cancel button directly.
- Use `id` for the cancel call (4.6).

Errors: `400` (missing `clientId`), `500`.

**Raw passthrough (advanced / reports):**
```
GET /api/attendances/report?client_id=<id>&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```
Optional: `page` (default 1), `rows_per_page` (default 100), `only_absences` (0|1), `only_repositions` (0|1).
Returns the raw SeuFisio attendance report unmodified. Prefer `/client/:clientId` for the site UI.

---

### 4.6 Cancel a booking (8-hour rule)

```
POST /api/attendances/:id/cancel
```
`:id` = the `atendimento.id` from booking (4.4).

**200 — cancelled**
```json
{
  "success": true,
  "message": "Atendimento 55123 cancelado com sucesso",
  "hours_until_class": 26.5,
  "status_id": 0,
  "atendimento": { /* updated attendance */ }
}
```

**422 — inside the 8h window (not allowed)**
```json
{
  "error": "Cancellation not allowed: class starts in 5.0h, which is less than the 8h minimum.",
  "class_start": "2026-07-10 08:00",
  "hours_until_class": 5.0,
  "min_hours": 8
}
```

Also `422` if the attendance has no scheduled date/time. `500` on upstream failure.

UX: show the deadline ("cancel until 8h before class") and disable the button once inside the window,
but still handle the `422` in case of a race.

---

## 5. Reference data (clinic 9208)

Attendance types the website may need (`GET /api/attendance-types` returns the full active list):

| id | nome | used for |
|----|------|----------|
| 13 | Totalpass | `source: "totalpass"` |
| 12 | Sessão Avulsa | `source: "wellhub"` |
| 11 | Sessão Avaliação | evaluation session (not an app source) |
| 8 / 9 / 10 | Pilates 1x / 2x / 3x na Semana | recurring plans (not this flow) |

Professionals: `GET /api/professionals` → `{ professionals: [{ id, nome, ativo }] }`.

---

## 6. Suggested website UI states

1. **CPF entry** → loading → found / not-found (offer register).
2. **Register** (only if not found) → success → continue.
3. **Date picker + agenda** → list of available slots grouped by professional/time.
4. **Confirm booking** → show slot + source (Totalpass/Wellhub) → success screen with booking id.
5. **My bookings** → list from report → per booking: cancel button (enabled only if > 8h away).

---

## 7. Open items (backend, before go-live)

- [ ] **Cancelled `status_id`** — the proxy resolves it by matching a status name containing
      "cancel". Confirm the correct id from `GET /api/attendances/statuses` and pin it via the
      `CANCELLED_STATUS_ID` env var. *(Blocks reliable cancellation.)*
- [ ] Decide whether the **new-clients-can't-use-apps** rule needs a hard server-side block in the
      proxy, or stays a website-only gate.
- [ ] Confirm the proxy host/URL and issue the website backend its `API_SECRET_TOKEN`.
