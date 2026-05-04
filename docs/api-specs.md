# API Specs — TotalPass Match & Wellhub Import

These two endpoints are consumed by the NF Generator frontend. Both must be implemented on the SeuFisio proxy server. They authenticate with SeuFisio internally and return normalized client data ready for invoice generation.

---

## Table of Contents

1. [Common Requirements](#1-common-requirements)
2. [Shared Schemas](#2-shared-schemas)
3. [API 1 — TotalPass: Match by CPF](#3-api-1--totalpass-match-by-cpf)
4. [API 2 — Wellhub: Parse XLSX and Match by Name](#4-api-2--wellhub-parse-xlsx-and-match-by-name)
5. [SeuFisio Internal API Reference](#5-seufisio-internal-api-reference)
6. [Error Reference](#6-error-reference)
7. [API 3 — Client Search (Manual NF Lookup)](#7-api-3--client-search-manual-nf-lookup)
8. [API 4 — Client Detail by ID](#8-api-4--client-detail-by-id)

---

## 1. Common Requirements

### Authentication to SeuFisio

Both endpoints need the proxy to authenticate with SeuFisio using OAuth2 before making internal API calls.

**Token request:**

```http
POST {SEUFISIO_AUTH_URL}
Content-Type: application/json

{
  "grant_type": "password",
  "client_id": "{SEUFISIO_CLIENT_ID}",
  "client_secret": "{SEUFISIO_CLIENT_SECRET}",
  "username": "{SEUFISIO_USER_NAME}",
  "password": "{SEUFISIO_PASSWORD}"
}
```

**Token response:**

```json
{
  "access_token": "eyJ...",
  "expires_in": 3600
}
```

Cache the token in memory and reuse it until it expires (subtract a 10-second safety buffer from `expires_in`).

**Required headers for all SeuFisio API calls:**

```
Authorization: Bearer {access_token}
SetFisio: {SEUFISIO_SETFISIO_HEADER}
x-version-app: {SEUFISIO_APP_VERSION}
X-Requested-With: XMLHttpRequest
acesso: web-desktop
Accept: application/json, text/plain, */*
Origin: https://app.seufisio.com.br
Referer: https://app.seufisio.com.br/
```

### Response envelope

All responses use a consistent JSON envelope:

**Success:**
```json
{ "data": <payload> }
```

**Error:**
```json
{ "error": "Human-readable error message in Portuguese" }
```

HTTP status codes: `200` success, `400` bad request, `500` internal error.

---

## 2. Shared Schemas

### `NormalizedClient`

Returned inside every match result. Fields come from the SeuFisio client detail endpoint. Empty string `""` means the field was not found in SeuFisio.

```jsonc
{
  "id": "12345",                     // SeuFisio client ID — empty if not matched
  "name": "Maria da Silva",
  "email": "maria@email.com",
  "document": "12345678901",         // CPF (11 digits) or CNPJ (14 digits), digits only
  "personType": "PF",                // "PF" | "PJ" | "UNKNOWN"
  "phone": "11999998888",
  "municipalRegistration": "",       // Inscrição municipal — PJ only
  "streetType": "RUA",               // Tipo logradouro: RUA, AV, ALAMEDA, etc.
  "addressLine1": "Rua das Flores",  // Full street as returned by SeuFisio
  "addressStreetName": "das Flores", // Street name without the type prefix
  "addressNumber": "123",
  "addressComplement": "Apto 5",
  "district": "Jardim América",      // Bairro
  "city": "Bragança Paulista",
  "state": "SP",                     // UF, 2 characters
  "zipCode": "12900000"              // CEP, 8 digits only
}
```

### `ValidationIssue`

```jsonc
{
  "field": "zipCode",   // Internal field name
  "label": "CEP"        // Human-readable label in Portuguese
}
```

Possible `field` values and their `label`:

| field                | label                   | Rule                              |
|----------------------|-------------------------|-----------------------------------|
| `name`               | nome / razão social     | Missing or empty                  |
| `document`           | CPF/CNPJ                | Missing or empty                  |
| `document`           | CPF inválido            | Present but fails CPF check digit |
| `document`           | CNPJ inválido           | Present but fails CNPJ check digit|
| `addressLine1`       | logradouro              | Missing or empty                  |
| `addressNumber`      | número                  | Missing or empty                  |
| `district`           | bairro                  | Missing or empty                  |
| `city`               | cidade                  | Missing or empty                  |
| `state`              | UF                      | Missing or empty                  |
| `zipCode`            | CEP                     | Missing or empty                  |

### `ClientValidation`

```jsonc
{
  "isValid": true,      // true only when issues array is empty
  "issues": []          // Array of ValidationIssue
}
```

### `TotalPassRow` (input)

```jsonc
{
  "name": "Ana Beatriz Da Fonseca",
  "document": "06573456955",   // CPF digits only (11 digits)
  "address": "Est Mun Afonso ferreira lopes - Curitibanos",
  "complement": "Chacara souza",
  "city": "Bragança paulista",
  "state": "SP",
  "email": "anabeatriz@gmail.com",
  "amount": 32.84              // Valor líquido total
}
```

### `TotalPassMatchResult` (output)

```jsonc
{
  "csvRow": { /* TotalPassRow */ },
  "client": { /* NormalizedClient */ },
  "validation": { /* ClientValidation */ },
  "matchedInSeuFisio": true   // false if client was not found by CPF
}
```

### `WellhubRow` (internal — for reference)

```jsonc
{
  "name": "Julia Nagem Abelaira",
  "amount": 224.00   // Sum of all check-in payments for this visitor
}
```

### `WellhubMatchResult` (output)

```jsonc
{
  "wellhubRow": { /* WellhubRow */ },
  "client": { /* NormalizedClient */ },
  "validation": { /* ClientValidation */ },
  "matchedInSeuFisio": true   // false if client was not found by name
}
```

---

## 3. API 1 — TotalPass: Match by CPF

### Endpoint

```
POST /api/seufisio/totalpass
Content-Type: application/json
```

### Purpose

Receives the rows already parsed from the TotalPass CSV (the frontend does the CSV parsing). For each row, searches SeuFisio by CPF to find and hydrate the matching client. Returns all rows with their matched (or fallback) client data.

### Request Body

```jsonc
{
  "rows": [
    {
      "name": "Alani Tognetti Gasparotto",
      "document": "53865745822",
      "address": "R Netuno - Jardim Solar",
      "complement": "",
      "city": "Bragança Paulista",
      "state": "SP",
      "email": "alani.gasparotto@gmail.com",
      "amount": 16.42
    },
    {
      "name": "Ana Beatriz Da Fonseca Fontes Tsukase",
      "document": "06573456955",
      "address": "Est Mun Afonso ferreira lopes - Curitibanos",
      "complement": "Chacara souza",
      "city": "Bragança paulista",
      "state": "SP",
      "email": "anabeatrizdafonsecafontes@gmail.com",
      "amount": 32.84
    }
  ]
}
```

**Validation rules:**
- `rows` must be a non-empty array.
- Each row must have at minimum `document` (CPF digits) and `amount > 0`.

### Business Logic — Matching Algorithm

Process all rows **concurrently** (`Promise.all` or equivalent). For each row:

```
1. Normalize the CPF: strip all non-digit characters from row.document.

2. Call SeuFisio client search with the normalized CPF as the filter query.
   (See Section 5.1 — Client Search)

3. From the search results, find the first result where:
     normalize_digits(result.document) === row.document
   (exact CPF digit match)

4. If an exact match is found:
     a. Call SeuFisio client detail with the matched client's ID.
        (See Section 5.2 — Client Detail)
     b. Normalize the full client data into NormalizedClient (see Section 5.3).
     c. Run ClientValidation on the normalized client (see Section 2, table above).
     d. Set matchedInSeuFisio = true.

5. If NO match is found (or if the SeuFisio calls fail):
     a. Build a NormalizedClient from the CSV row data (fallback):
        - id: ""
        - name: row.name
        - document: row.document
        - email: row.email
        - personType: "PF" (CPF has 11 digits) | "PJ" (CNPJ has 14 digits)
        - addressLine1: the part of row.address BEFORE the last " - " separator
        - district: the part of row.address AFTER the last " - " separator
        - city: row.city (trimmed)
        - state: row.state (trimmed)
        - addressComplement: row.complement
        - addressNumber: ""   ← not available in TotalPass CSV
        - zipCode: ""          ← not available in TotalPass CSV
        - all other fields: ""
     b. Run ClientValidation on this fallback client.
     c. Set matchedInSeuFisio = false.

6. Append the result to the output array in the same order as the input.
```

> **Note:** If a row's SeuFisio search throws an error (network failure, API error), log the error and continue with the CSV fallback — do not fail the entire batch.

### CPF Validation (for `ClientValidation`)

If the client has a document:
- 11 digits → validate as CPF using the standard two-check-digit algorithm.
- 14 digits → validate as CNPJ using the standard two-check-digit algorithm.
- Any other length → no extra validation (presence check only already failed).

If the check digits fail, add issue `{ field: "document", label: "CPF inválido" }` (or "CNPJ inválido").

### Success Response

**HTTP 200**

```jsonc
{
  "data": [
    {
      "csvRow": {
        "name": "Alani Tognetti Gasparotto",
        "document": "53865745822",
        "address": "R Netuno - Jardim Solar",
        "complement": "",
        "city": "Bragança Paulista",
        "state": "SP",
        "email": "alani.gasparotto@gmail.com",
        "amount": 16.42
      },
      "client": {
        "id": "8821",
        "name": "Alani Tognetti Gasparotto",
        "email": "alani.gasparotto@gmail.com",
        "document": "53865745822",
        "personType": "PF",
        "phone": "11987654321",
        "municipalRegistration": "",
        "streetType": "RUA",
        "addressLine1": "Rua Netuno",
        "addressStreetName": "Netuno",
        "addressNumber": "45",
        "addressComplement": "",
        "district": "Jardim Solar",
        "city": "Bragança Paulista",
        "state": "SP",
        "zipCode": "12905000"
      },
      "validation": {
        "isValid": true,
        "issues": []
      },
      "matchedInSeuFisio": true
    },
    {
      "csvRow": { "name": "Ana Beatriz Da Fonseca Fontes Tsukase", "document": "06573456955", "amount": 32.84, "..." : "..." },
      "client": {
        "id": "",
        "name": "Ana Beatriz Da Fonseca Fontes Tsukase",
        "document": "06573456955",
        "personType": "PF",
        "addressLine1": "Est Mun Afonso ferreira lopes",
        "district": "Curitibanos",
        "addressNumber": "",
        "zipCode": "",
        "city": "Bragança paulista",
        "state": "SP",
        "email": "anabeatrizdafonsecafontes@gmail.com",
        "..." : ""
      },
      "validation": {
        "isValid": false,
        "issues": [
          { "field": "addressNumber", "label": "número" },
          { "field": "zipCode", "label": "CEP" }
        ]
      },
      "matchedInSeuFisio": false
    }
  ]
}
```

### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `400`  | `{ "error": "Nenhuma linha enviada." }` | `rows` missing or empty |
| `500`  | `{ "error": "Erro ao processar TotalPass." }` | Unhandled exception |

---

## 4. API 2 — Wellhub: Parse XLSX and Match by Name

### Endpoint

```
POST /api/wellhub
Content-Type: multipart/form-data
```

**Form field:** `file` — the XLSX file exported from Wellhub.

### Purpose

Accepts the XLSX file exported from the Wellhub partner portal. Parses the **Check-ins** sheet, groups all visits by visitor name (summing the payment per visit), then searches SeuFisio for each unique visitor by name. Returns matched (or fallback) client data with the aggregated total per visitor.

### Request

```
POST /api/wellhub
Content-Type: multipart/form-data; boundary=----FormBoundary

------FormBoundary
Content-Disposition: form-data; name="file"; filename="wellhub.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

<binary XLSX content>
------FormBoundary--
```

### XLSX File Structure

The Wellhub export contains two sheets. Only **Check-ins** is used.

**Check-ins sheet layout:**

| Row | Content |
|-----|---------|
| 0   | Title string (e.g. "Veja todos os check-ins que você teve em março.") — skip |
| 1   | Empty — skip |
| 2   | **Column headers**: Unidade \| Data \| Hora \| Visitante \| Produto \| Tipo de check-in \| Pagamento |
| 3+  | Data rows |

**Column index mapping (0-based):**

| Index | Name              | Example value              | Notes |
|-------|-------------------|----------------------------|-------|
| 0     | Unidade           | MovArt Pilates e Fisioterapia | Ignored |
| 1     | Data              | 2026-03-02                 | ISO date string |
| 2     | Hora              | 17:43                      | Ignored |
| **3** | **Visitante**     | **Julia Nagem Abelaira**   | **Group key** |
| 4     | Produto           | Pilates                    | Ignored |
| 5     | Tipo de check-in  | Visita                     | Ignored |
| **6** | **Pagamento**     | **R$28.00**                | **Amount per visit** |

### Business Logic

#### Step 1 — Parse XLSX

```
1. Read the binary XLSX file (via SheetJS or equivalent library).
2. Open the sheet named "Check-ins". If not found, use the first sheet.
3. Scan rows to find the header row: the first row containing the cell value "Visitante".
   Data rows start at header_row_index + 1.
4. For each data row:
   a. visitor_name = row[3].trim()   — skip if empty
   b. payment_str  = row[6]          — format: "R$28.00"
   c. amount = parseFloat(payment_str.replace("R$", "").replace(",", "."))
   d. Skip rows where amount <= 0 or visitor_name is empty.
5. Group by visitor_name, summing amounts:
   grouped[visitor_name] += amount
```

**Payment parsing examples:**

| Raw value | Parsed |
|-----------|--------|
| `"R$28.00"` | `28.00` |
| `"R$112,50"` | `112.50` (comma → period) |
| `28` (number) | `28.00` |

#### Step 2 — Match each visitor in SeuFisio

Process all unique visitors **concurrently**. For each visitor:

```
1. Normalize the visitor name for comparison:
   normalized = lowercase → remove diacritics (NFD decompose, strip combining chars) → collapse spaces → trim

   Example: "Gleice Kelly Pinheiro de Jesus" → "gleice kelly pinheiro de jesus"
   Example: "Gabriela Verônica de Souza"    → "gabriela veronica de souza"

2. Call SeuFisio client search with the full visitor name as the filter query.
   (See Section 5.1 — Client Search)

3. Try EXACT match first:
   Find the first search result where normalize(result.name) === normalize(visitor_name)

4. If no exact match, try PARTIAL match:
   Find the first result where ALL words from the normalized query name that are
   longer than 2 characters appear in normalize(result.name).

   Example query words: ["gleice", "kelly", "pinheiro", "jesus"]
   (words "de" is skipped — length <= 2)

5. If a match is found (exact or partial):
   a. Call SeuFisio client detail with matched client's ID.
      (See Section 5.2 — Client Detail)
   b. Normalize the full client data into NormalizedClient (see Section 5.3).
   c. Run ClientValidation.
   d. Set matchedInSeuFisio = true.

6. If NO match is found (or SeuFisio calls fail):
   a. Build a minimal NormalizedClient as fallback:
      - id: ""
      - name: visitor_name (original casing from XLSX)
      - all other fields: ""
      - personType: "UNKNOWN"
   b. Run ClientValidation (will have many issues — name OK, but no document/address).
   c. Set matchedInSeuFisio = false.

7. Build WellhubMatchResult:
   {
     wellhubRow: { name: visitor_name, amount: grouped_total },
     client: <NormalizedClient>,
     validation: <ClientValidation>,
     matchedInSeuFisio: <bool>
   }
```

> **Note:** If a visitor's SeuFisio search throws an error, log it and continue with the fallback — do not fail the entire batch.

### Success Response

**HTTP 200**

```jsonc
{
  "data": [
    {
      "wellhubRow": {
        "name": "Julia Nagem Abelaira",
        "amount": 224.00   // 8 check-ins × R$28.00
      },
      "client": {
        "id": "4412",
        "name": "Julia Nagem Abelaira",
        "email": "julia.nagem@gmail.com",
        "document": "39571234890",
        "personType": "PF",
        "phone": "11988887777",
        "municipalRegistration": "",
        "streetType": "RUA",
        "addressLine1": "Rua das Margaridas",
        "addressStreetName": "das Margaridas",
        "addressNumber": "200",
        "addressComplement": "Apto 12",
        "district": "Jardim Floral",
        "city": "Bragança Paulista",
        "state": "SP",
        "zipCode": "12906000"
      },
      "validation": {
        "isValid": true,
        "issues": []
      },
      "matchedInSeuFisio": true
    },
    {
      "wellhubRow": {
        "name": "Gleice Kelly Pinheiro de Jesus",
        "amount": 140.00   // 5 check-ins × R$28.00
      },
      "client": {
        "id": "5834",
        "name": "Gleice Kelly Pinheiro de Jesus",
        "email": "gleicekelly@hotmail.com",
        "document": "44567890123",
        "personType": "PF",
        "phone": "",
        "municipalRegistration": "",
        "streetType": "AV",
        "addressLine1": "Avenida Brasil",
        "addressStreetName": "Brasil",
        "addressNumber": "1000",
        "addressComplement": "",
        "district": "Centro",
        "city": "Bragança Paulista",
        "state": "SP",
        "zipCode": "12900100"
      },
      "validation": {
        "isValid": true,
        "issues": []
      },
      "matchedInSeuFisio": true
    },
    {
      "wellhubRow": {
        "name": "Renan Serrano Imenez",
        "amount": 28.00
      },
      "client": {
        "id": "",
        "name": "Renan Serrano Imenez",
        "email": "",
        "document": "",
        "personType": "UNKNOWN",
        "phone": "",
        "municipalRegistration": "",
        "streetType": "",
        "addressLine1": "",
        "addressStreetName": "",
        "addressNumber": "",
        "addressComplement": "",
        "district": "",
        "city": "",
        "state": "",
        "zipCode": ""
      },
      "validation": {
        "isValid": false,
        "issues": [
          { "field": "document",      "label": "CPF/CNPJ" },
          { "field": "addressLine1",  "label": "logradouro" },
          { "field": "addressNumber", "label": "número" },
          { "field": "district",      "label": "bairro" },
          { "field": "city",          "label": "cidade" },
          { "field": "state",         "label": "UF" },
          { "field": "zipCode",       "label": "CEP" }
        ]
      },
      "matchedInSeuFisio": false
    }
  ]
}
```

### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `400`  | `{ "error": "Arquivo não enviado." }` | `file` field missing in form |
| `400`  | `{ "error": "Nenhum check-in encontrado no arquivo." }` | File parsed but yielded 0 valid rows |
| `500`  | `{ "error": "Erro ao processar Wellhub." }` | Unhandled exception (parse failure, etc.) |

---

## 5. SeuFisio Internal API Reference

Both endpoints make these two SeuFisio calls internally. Authentication token must be obtained as described in Section 1.

### 5.1 — Client Search

```http
GET {SEUFISIO_API_BASE_URL}/cliente
Authorization: Bearer {access_token}
SetFisio: {SEUFISIO_SETFISIO_HEADER}
[... other required headers from Section 1]
```

**Query parameters:**

| Parameter | Value | Notes |
|-----------|-------|-------|
| `page` | `1` | Always page 1 — search results are single-page |
| `filter` | `{query}` | CPF string (TotalPass) or full name (Wellhub) |
| `filtro_avancado[busca_identificadores_ampliada]` | `true` | Enables broad identifier search |
| `filtro_avancado[situacao]` | `2` | Active clients only |
| `filtro_avancado[telefone]` | *(empty)* | |
| `filtro_avancado[tipo_cliente]` | *(empty)* | |
| `filtro_avancado[pacote_ativo]` | *(empty)* | |

**Response shape:**

```jsonc
{
  "data": [
    {
      "id": "8821",
      "nome": "Alani Tognetti Gasparotto",
      "cpf": "538.657.458-22",        // may be formatted
      "cnpj": "",
      "email": "alani@gmail.com",
      "cidade": "Bragança Paulista",
      "uf": "SP"
    }
  ],
  "last_page": 1,
  "total": 1
}
```

Pick the array from `data`, `items`, `results`, `clientes`, or `contas` — whichever key contains the array.

**Matching after search:**

- **TotalPass:** compare `normalize_digits(result.cpf || result.documento)` with the input CPF.
- **Wellhub:** compare normalized names as described in Section 4 Step 2.

### 5.2 — Client Detail

```http
GET {SEUFISIO_API_BASE_URL}/cliente/{id}
Authorization: Bearer {access_token}
[... other required headers from Section 1]
```

The path template is configured via `SEUFISIO_CLIENT_DETAIL_PATH_TEMPLATE` (default: `/cliente/{id}`).

**Response shape:** A flat object (no `data` wrapper):

```jsonc
{
  "id": "8821",
  "nome": "Alani Tognetti Gasparotto",
  "cpf": "538.657.458-22",
  "email": "alani@gmail.com",
  "telefone": "11987654321",
  "endereco": "Rua Netuno",
  "endereco_numero": "45",
  "endereco_complemento": "",
  "bairro": "Jardim Solar",
  "cidade": "Bragança Paulista",
  "uf": "SP",
  "cep": "12905-000",
  "dados_cobranca": {
    "cpf": "538.657.458-22",
    "email": "alani@gmail.com"
  }
}
```

### 5.3 — Client Normalization Rules

Apply these transformations to the raw SeuFisio detail response before building `NormalizedClient`:

| `NormalizedClient` field | SeuFisio source fields (first non-empty wins) |
|--------------------------|-----------------------------------------------|
| `id` | `id`, `cliente_id`, `codigo`, `uuid` |
| `name` | `nome`, `nome_registro`, `razao_social`, `nome_fantasia` |
| `email` | `email`, `mail`, `email_principal` |
| `document` | `cnpj` or `cpf` — strip all non-digits. CNPJ takes priority over CPF. Also checks `dados_cobranca` subobject. |
| `personType` | `"PJ"` if CNPJ present or `tipo_pessoa == "PJ"` · `"PF"` if CPF present or `tipo_pessoa == "PF"` · else `"UNKNOWN"` |
| `phone` | `telefone`, `telefone_2`, `telefone_responsavel`, `celular` |
| `municipalRegistration` | `inscricao_municipal`, `inscricaoMunicipal` |
| `addressLine1` | `endereco`, `logradouro`, `rua`, `street` |
| `streetType` | `tipo_logradouro` — or extract from `addressLine1` prefix (RUA, AV, ALAMEDA, PRAÇA, TRAVESSA, ESTRADA, RODOVIA, LARGO, VIA) |
| `addressStreetName` | `addressLine1` with the street type prefix removed |
| `addressNumber` | `endereco_numero`, `numero`, `number` |
| `addressComplement` | `endereco_complemento`, `complemento` |
| `district` | `bairro`, `bairro_nome` |
| `city` | `cidade`, `city`, `cidade_nome` |
| `state` | `uf`, `estado`, `state` |
| `zipCode` | `cep`, `zipcode`, `zip_code`, `codigo_postal` — strip all non-digits |

**`dados_cobranca` merge:** If the client object has a `dados_cobranca` subobject, merge it into the base record before applying the rules above. The base record fields take priority over `dados_cobranca` fields (spread `dados_cobranca` first, then spread the base record on top).

---

## 6. Error Reference

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Client error — invalid or missing input |
| `500` | Server error — SeuFisio failure or unhandled exception |

### Partial Failure Handling

Both APIs process rows **concurrently**. If an individual row fails (SeuFisio search error, network timeout, etc.):

- Log the error with the identifier (CPF for TotalPass, name for Wellhub).
- Fall back to building a `NormalizedClient` from the input data (CSV row or XLSX row).
- Set `matchedInSeuFisio: false`.
- **Do not fail the entire batch** — return the result for that row using the fallback.

Only return HTTP 500 if the request itself cannot be processed at all (e.g. JSON parse error, authentication failure, XLSX read failure).

### SeuFisio Authentication Failures

If the token request fails, return:

```json
{ "error": "Falha na autenticação com o SeuFisio." }
```

with HTTP 500.

---

---

## 7. API 3 — Client Search (Manual NF Lookup)

### Endpoint

```
GET /api/seufisio/client/search?q=<query>
```

### Purpose

Search SeuFisio for clients by name or CPF and return fully normalized `NormalizedClient` objects ready for NF generation. Intended for **manual matching** when the automatic TotalPass (API 1) or Wellhub (API 2) matching fails — the NF Generator frontend can let the user search and pick the correct client from the results.

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `q` | Yes | Search term: a person's name (partial match) or CPF digits (11 digits) |

### Business Logic

```
1. Call SeuFisio client search with q as the filter (Section 5.1).
2. For each result, call SeuFisio client detail with the result's ID (Section 5.2).
   Process all detail calls concurrently (Promise.all).
   If an individual detail call fails, fall back to normalizing from the search result.
3. Normalize each client using Section 5.3 rules.
4. Run ClientValidation on each normalized client (Section 2).
5. Return the array in the same order as the SeuFisio search response.
```

### Success Response

**HTTP 200**

```jsonc
{
  "data": [
    {
      "client": {
        "id": "8821",
        "name": "Alani Tognetti Gasparotto",
        "email": "alani.gasparotto@gmail.com",
        "document": "53865745822",
        "personType": "PF",
        "phone": "11987654321",
        "municipalRegistration": "",
        "streetType": "RUA",
        "addressLine1": "Rua Netuno",
        "addressStreetName": "Netuno",
        "addressNumber": "45",
        "addressComplement": "",
        "district": "Jardim Solar",
        "city": "Bragança Paulista",
        "state": "SP",
        "zipCode": "12905000"
      },
      "validation": {
        "isValid": true,
        "issues": []
      }
    }
  ]
}
```

An empty `data` array (`[]`) is a valid 200 response when no clients match the query.

### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `400`  | `{ "error": "Parâmetro q é obrigatório." }` | `q` missing or empty |
| `500`  | `{ "error": "Erro ao buscar clientes." }` | Unhandled exception |

---

## 8. API 4 — Client Detail by ID

### Endpoint

```
GET /api/seufisio/client/:id
```

### Purpose

Fetch full details for a single SeuFisio client by their ID. Returns a normalized `NormalizedClient` with `ClientValidation` — the same structure used inside every match result from APIs 1 and 2. Use this after the user picks a result from the search (API 3) to confirm the final data before generating the invoice.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | SeuFisio client ID |

### Business Logic

```
1. Call SeuFisio client detail with the provided ID (Section 5.2).
2. Normalize the result using Section 5.3 rules.
3. Run ClientValidation on the normalized client (Section 2).
4. Return the result.
```

### Success Response

**HTTP 200**

```jsonc
{
  "data": {
    "client": {
      "id": "4412",
      "name": "Julia Nagem Abelaira",
      "email": "julia.nagem@gmail.com",
      "document": "39571234890",
      "personType": "PF",
      "phone": "11988887777",
      "municipalRegistration": "",
      "streetType": "RUA",
      "addressLine1": "Rua das Margaridas",
      "addressStreetName": "das Margaridas",
      "addressNumber": "200",
      "addressComplement": "Apto 12",
      "district": "Jardim Floral",
      "city": "Bragança Paulista",
      "state": "SP",
      "zipCode": "12906000"
    },
    "validation": {
      "isValid": true,
      "issues": []
    }
  }
}
```

### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `404`  | `{ "error": "Cliente não encontrado." }` | SeuFisio returns 404 for the given ID |
| `500`  | `{ "error": "Erro ao buscar cliente." }` | Unhandled exception |

---

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `SEUFISIO_AUTH_URL` | OAuth2 token endpoint | `https://auth.seufisio.com.br/oauth/token` |
| `SEUFISIO_API_BASE_URL` | Base URL for SeuFisio REST API | `https://api.seufisio.com.br` |
| `SEUFISIO_CLIENT_ID` | OAuth2 client ID | `abc123` |
| `SEUFISIO_CLIENT_SECRET` | OAuth2 client secret | `secret456` |
| `SEUFISIO_SETFISIO_HEADER` | Value for the `SetFisio` header | `tenant-id` |
| `SEUFISIO_USER_NAME` | SeuFisio username (password grant) | `user@clinic.com` |
| `SEUFISIO_PASSWORD` | SeuFisio password | `pass123` |
| `SEUFISIO_APP_VERSION` | App version header | `1.0.0` |
| `SEUFISIO_CLIENTS_PATH` | Client search path (default: `/cliente`) | `/cliente` |
| `SEUFISIO_CLIENT_DETAIL_PATH_TEMPLATE` | Client detail path template (default: `/cliente/{id}`) | `/cliente/{id}` |
