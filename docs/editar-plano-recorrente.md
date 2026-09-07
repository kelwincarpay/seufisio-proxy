# Fluxo capturado — editar-plano-recorrente

Gerado de `/Users/macbook/Documents/movart/movart-seufisio-proxy/reqs/editar-plano-cliente.har` por `scripts/har-to-spec.ts`, em ordem cronológica.
Tokens e cookies redigidos. Arrays e corpos longos foram cortados.

## Resumo do fluxo

| # | Método | Path | Status | Query |
| --- | --- | --- | --- | --- |
| 1 | GET | `/api/cliente-new/totais-listagens` | 200 | — |
| 2 | GET | `/api/interesse` | 200 | `rowsPerPage=all` |
| 3 | GET | `/api/etiqueta` | 200 | `rowsPerPage=all` |
| 4 | GET | `/api/cliente` | 200 | `page=1&filtro_avancado%5Bbusca_identificadores_ampliada%5D=true&filtro_avancado%5Bsituacao%5D=2&filtro_avancado%5Btelefone%5D=&filtro_avancado%5Btipo_cliente%5D=&filtro_avancado%5Bpacote_ativo%5D=&filter=Isadora` |
| 5 | GET | `/api/cliente/322/listar-vendas` | 200 | `tab=ativas&page=1&per_page=6` |
| 6 | GET | `/api/cliente/322/listar-vendas-resumo` | 200 | — |
| 7 | GET | `/api/conta-receber` | 200 | `page=1&rowsPerPage=25&filterWhere%5Bpago%5D=0&filterWhere%5Bcliente_id%5D=322&filterWhere%5Bdata_vencimento_final%5D=2026-09-07` |
| 8 | GET | `/api/cliente/322` | 200 | — |
| 9 | GET | `/api/profissional` | 200 | `rowsPerPage=all` |
| 10 | GET | `/api/interesse` | 200 | `rowsPerPage=all` |
| 11 | GET | `/api/cliente/322/view-acesso-app-cliente` | 204 | — |
| 12 | GET | `/api/cliente/322/servicos-pacotes-ativos` | 200 | — |
| 13 | GET | `/api/stripe/account/status` | 200 | — |
| 14 | GET | `/api/stripe/account` | 200 | — |
| 15 | GET | `/api/customer-credit-card/get-cards-by-customer/322` | 200 | — |
| 16 | GET | `/api/status` | 200 | `rowsPerPage=all` |
| 17 | GET | `/api/tipo-atendimento` | 200 | `rowsPerPage=all` |
| 18 | GET | `/api/sala` | 200 | `rowsPerPage=all` |
| 19 | GET | `/api/convenio` | 200 | `rowsPerPage=all` |
| 20 | GET | `/api/tipo-atendimento` | 200 | `rowsPerPage=all` |
| 21 | GET | `/api/profissional/todos-profissionais` | 200 | — |
| 22 | GET | `/api/atendimento` | 200 | `page=1&rowsPerPage=5&descending=true&filterWhere%5Bcliente_id%5D=322&filterWhere%5Bavulso%5D=true` |
| 23 | GET | `/api/cliente-servico/125` | 200 | — |
| 24 | GET | `/api/servico-ciclo` | 200 | `page=1&rowsPerPage=20&descending=true&servico_id=125` |
| 25 | GET | `/api/cliente-servico/primeiro-ciclo/125` | 200 | — |
| 26 | GET | `/api/cliente-servico/ultimo-ciclo/125` | 200 | — |
| 27 | GET | `/api/convenio` | 200 | `rowsPerPage=all` |
| 28 | GET | `/api/customer-credit-card/get-cards-by-customer/322` | 200 | — |
| 29 | GET | `/api/cliente-servico/ultimo-ciclo/125` | 200 | — |
| 30 | GET | `/api/tipo-atendimento/8` | 200 | — |
| 31 | GET | `/api/user` | 200 | `rowsPerPage=all` |
| 32 | GET | `/api/user` | 200 | `rowsPerPage=all` |
| 33 | PUT | `/api/cliente-servico/125` | 200 | — |
| 34 | GET | `/api/cliente/322/listar-vendas` | 200 | `tab=ativas&page=1&per_page=6` |
| 35 | GET | `/api/cliente-servico/125` | 200 | — |
| 36 | GET | `/api/servico-ciclo` | 200 | `page=1&rowsPerPage=20&descending=true&servico_id=125` |

---

## 1. GET /api/cliente-new/totais-listagens

`2026-09-07T16:00:42.863Z` · status **200** · 184ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente-new/totais-listagens' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "clientes": 314,
  "clientes_fixo": 105,
  "clientes_rotativo": 209,
  "clientes_com_planos_ativos": 74,
  "clientes_sem_planos": 240,
  "clientes_sem_planos_fixo": 48,
  "clientes_sem_planos_rotativo": 192,
  "proximas_renovacoes": 5,
  "clientes_com_faturas_abertas": 4,
  "lista_espera": 0,
  "clientes_inativos": 8,
  "atendimentos_aguardando_reposicao": 17
}
```

---

## 2. GET /api/interesse

`2026-09-07T16:00:42.863Z` · status **200** · 87ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/interesse?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 6,
    "nome": "Alivio de Dor",
    "utilizar_no_crm": true,
    "created_at": "2025-04-28T21:11:18.000000Z",
    "updated_at": "2025-04-28T21:11:18.000000Z",
    "interesse_clientes_count": 2,
    "slug_nome": "alivio-de-dor",
    "qtd_clientes": 2
  },
  {
    "id": 5,
    "nome": "Alongamento",
    "utilizar_no_crm": true,
    "created_at": null,
    "updated_at": null,
    "interesse_clientes_count": 0,
    "slug_nome": "alongamento",
    "qtd_clientes": 0
  },
  {
    "id": 4,
    "nome": "Aumento de massa muscular",
    "utilizar_no_crm": true,
    "created_at": null,
    "updated_at": null,
    "interesse_clientes_count": 0,
    "slug_nome": "aumento-de-massa-muscular",
    "qtd_clientes": 0
  },
  "… +4 itens (cortado)"
]
```

---

## 3. GET /api/etiqueta

`2026-09-07T16:00:42.864Z` · status **200** · 82ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/etiqueta?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[]
```

---

## 4. GET /api/cliente

`2026-09-07T16:01:19.552Z` · status **200** · 138ms

### Query params

| Param | Valor |
| --- | --- |
| `page` | `1` |
| `filtro_avancado%5Bbusca_identificadores_ampliada%5D` | `true` |
| `filtro_avancado%5Bsituacao%5D` | `2` |
| `filtro_avancado%5Btelefone%5D` | `` |
| `filtro_avancado%5Btipo_cliente%5D` | `` |
| `filtro_avancado%5Bpacote_ativo%5D` | `` |
| `filter` | `Isadora` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente?page=1&filtro_avancado%5Bbusca_identificadores_ampliada%5D=true&filtro_avancado%5Bsituacao%5D=2&filtro_avancado%5Btelefone%5D=&filtro_avancado%5Btipo_cliente%5D=&filtro_avancado%5Bpacote_ativo%5D=&filter=Isadora' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "current_page": 1,
  "data": [
    {
      "id": 273,
      "nome": "Isadora Alborghetti Jorge",
      "telefone": "9) 99753-0873",
      "telefone_ddi": "BR",
      "situacao": 2,
      "dia_padrao_renovacao": null,
      "dia_padrao_cobranca": null,
      "foto": null,
      "tipo_cliente": 2,
      "pacote_fixo_recorrente": 0,
      "nivel_id": null,
      "mostrar_renovacao_pacote": true,
      "tipo_aluno": 0,
      "tipo_atendimento_id": null,
      "str_situacao": "Ativo",
      "url_avatar": "",
      "pacote_ativo": [],
      "pacote_fixo_ativo": [],
      "etiquetas": []
    },
    {
      "id": 284,
      "nome": "Isadora Caldas",
      "telefone": "997407667",
      "telefone_ddi": "BR",
      "situacao": 2,
      "dia_padrao_renovacao": null,
      "dia_padrao_cobranca": null,
      "foto": null,
      "tipo_cliente": 2,
      "pacote_fixo_recorrente": 0,
      "nivel_id": null,
      "mostrar_renovacao_pacote": true,
      "tipo_aluno": 0,
      "tipo_atendimento_id": null,
      "str_situacao": "Ativo",
      "url_avatar": "",
      "pacote_ativo": [],
      "pacote_fixo_ativo": [],
      "etiquetas": []
    },
    {
      "id": 322,
      "nome": "Isadora Sanfins Araujo",
      "telefone": "(11) 91493-7681",
      "telefone_ddi": "BR",
      "situacao": 2,
      "dia_padrao_renovacao": null,
      "dia_padrao_cobranca": null,
      "foto": "322.jpg",
      "tipo_cliente": 1,
      "pacote_fixo_recorrente": 0,
      "nivel_id": null,
      "mostrar_renovacao_pacote": true,
      "tipo_aluno": 5,
      "tipo_atendimento_id": null,
      "str_situacao": "Ativo",
      "url_avatar": "https://seufisio.s3.amazonaws.com/production/9208/cliente/322.jpg?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQVM4PM6KQEDL24OB%2F20260907%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260907T160119Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Signature=7bd237babd21e1b73c330acaf6b81e3ae4083e5aca8fd8457e63e73cd48b9e30",
      "pacote_ativo": [],
      "pacote_fixo_ativo": [],
      "etiquetas": []
    }
  ],
  "first_page_url": "https://api.seufisio.com.br/api/cliente?page=1",
  "from": 1,
  "last_page": 1,
  "last_page_url": "https://api.seufisio.com.br/api/cliente?page=1",
  "links": [
    {
      "url": null,
      "label": "« Anterior",
      "page": null,
      "active": false
    },
    {
      "url": "https://api.seufisio.com.br/api/cliente?page=1",
      "label": "1",
      "page": 1,
      "active": true
    },
    {
      "url": null,
      "label": "Próximo »",
      "page": null,
      "active": false
    }
  ],
  "next_page_url": null,
  "path": "https://api.seufisio.com.br/api/cliente",
  "per_page": 50,
  "prev_page_url": null,
  "to": 3,
  "total": 3
}
```

---

## 5. GET /api/cliente/322/listar-vendas

`2026-09-07T16:01:26.482Z` · status **200** · 111ms

### Query params

| Param | Valor |
| --- | --- |
| `tab` | `ativas` |
| `page` | `1` |
| `per_page` | `6` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente/322/listar-vendas?tab=ativas&page=1&per_page=6' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "data": [
    {
      "id": 125,
      "cicloId": 620,
      "tipoVenda": "servico_recorrente",
      "tipoAtendimentoNome": "Pilates 1x na Semana",
      "dataInicial": "2026-07-02",
      "validade": "2027-01-01",
      "atendimentosFeitos": 9,
      "atendimentosContratados": 0,
      "atendimentosRepor": 1,
      "valor": 200,
      "notaFiscalAutomatica": false,
      "cobrancaAutomatica": false,
      "informacoes": [
        "Quinta às 10:00, com Pri S. na sala Sala 01"
      ],
      "tipoAtendimentoId": 8,
      "periodicidade": 6,
      "periodicidadeLabel": null,
      "dataPause": null
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 6,
    "total": 1,
    "last_page": 1
  }
}
```

---

## 6. GET /api/cliente/322/listar-vendas-resumo

`2026-09-07T16:01:26.482Z` · status **200** · 113ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente/322/listar-vendas-resumo' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "ativas": 1,
  "inativas": 0
}
```

---

## 7. GET /api/conta-receber

`2026-09-07T16:01:26.482Z` · status **200** · 140ms

### Query params

| Param | Valor |
| --- | --- |
| `page` | `1` |
| `rowsPerPage` | `25` |
| `filterWhere%5Bpago%5D` | `0` |
| `filterWhere%5Bcliente_id%5D` | `322` |
| `filterWhere%5Bdata_vencimento_final%5D` | `2026-09-07` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/conta-receber?page=1&rowsPerPage=25&filterWhere%5Bpago%5D=0&filterWhere%5Bcliente_id%5D=322&filterWhere%5Bdata_vencimento_final%5D=2026-09-07' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "valor_total": 200,
  "current_page": 1,
  "data": [
    {
      "id": 805,
      "titulo": "Ref. serviço 125 ciclo: 02/09/2026",
      "descricao": null,
      "valor": 200,
      "valor_base_moloni": null,
      "valor_imposto_moloni": null,
      "cliente_id": 322,
      "produto_id": null,
      "atendimento_id": null,
      "pago": 0,
      "data_lancamento": "2026-08-12 05:16:28",
      "data_pagamento": null,
      "data_recebimento": null,
      "data_vencimento": "2026-09-02",
      "profissional_id": 1,
      "forma_pagamento_id": null,
      "pacote_id": null,
      "venda_id": null,
      "pacote_fixo_id": null,
      "cobranca_convenio": 0,
      "recibo_gerado": 0,
      "nfe_gerado": 0,
      "user_id": null,
      "recebido_por_user_id": null,
      "created_at": "2026-08-12T08:16:28.000000Z",
      "updated_at": "2026-08-12T08:16:28.000000Z",
      "gateway_pagamento": "juno",
      "id_cobranca_juno": null,
      "id_pagamento_juno": null,
      "aguardando_estorno": false,
      "valor_cobranca_juno": null,
      "dados_cobranca": null,
      "centro_custo_id": 1,
      "categoria_id": null,
      "atendimento_pacote_id": null,
      "atendimento_combo_id": null,
      "nota_fiscal_id": null,
      "nota_fiscal_status": null,
      "servico_ciclo_id": 620,
      "id_parcelamento_gateway": null,
      "cobranca_recorrente_automatica": false,
      "falha_cobrar_via_cartao": true,
      "falha_cobranca_mensagem_asaas": null,
      "easypay_key": null,
      "easypay_forma_pagamento": null,
      "moloni_id": null,
      "moloni_data_emissao": null,
      "nota_fiscal_data_emissao": null,
      "nota_fiscal_numero": null,
      "moloni_fatura_cancelada": false,
      "produtos_servicos_vinculados": "Pilates 1x na Semana",
      "codigo_autorizacao_transacao": null,
      "email_confirmacao_pagamento_enviado": null,
      "gateway_data_antecipacao": null,
      "retencao_valor_base": null,
      "retencao_valor_pis": null,
      "retencao_valor_cofins": null,
      "retencao_valor_csll": null,
      "retencao_valor_ir": null,
      "stripe_charge_id": null,
      "estorno_parcial": false,
      "nota_credito_document_id": null,
      "valor_bruto": 200,
      "valor_apenas_servicos": null,
      "eh_conta_manual": false,
      "cliente": {
        "id": 322,
        "nome": "Isadora Sanfins Araujo",
        "email": "isasanfins@hotmail.com",
        "cpf": "442.100.988-17",
        "telefone": "(11) 91493-7681",
        "telefone_ddi": "BR",
        "url_avatar": ""
      },
      "forma_pagamento": null,
      "cliente_dado_cobranca": {
        "cliente_id": 322,
        "nome": "Isadora Sanfins Araujo",
        "cpf": "442.100.988-17",
        "data_nascimento": "1995-01-19",
        "email": "isasanfins@hotmail.com",
        "forma_pagamento": "avista",
        "boleto": true,
        "cartao": false,
        "created_at": "2026-07-02T10:39:31.000000Z",
        "updated_at": "2026-07-02T18:47:56.000000Z",
        "tipo_pessoa": "PF",
        "telefone_ddi": null,
        "telefone": null,
        "asaas_customer_id": null,
        "asaas_notify": false,
        "retem_iss": false,
        "simples_nacional": true,
        "metodo_pagamento": "BOLETO"
      },
      "centro_custo": {
        "id": 1,
        "nome": "Pilates"
      },
      "atendimento_combo": null
    }
  ],
  "first_page_url": "https://api.seufisio.com.br/api/conta-receber?page=1",
  "from": 1,
  "last_page": 1,
  "last_page_url": "https://api.seufisio.com.br/api/conta-receber?page=1",
  "links": [
    {
      "url": null,
      "label": "« Anterior",
      "page": null,
      "active": false
    },
    {
      "url": "https://api.seufisio.com.br/api/conta-receber?page=1",
      "label": "1",
      "page": 1,
      "active": true
    },
    {
      "url": null,
      "label": "Próximo »",
      "page": null,
      "active": false
    }
  ],
  "next_page_url": null,
  "path": "https://api.seufisio.com.br/api/conta-receber",
  "per_page":
… (corpo cortado em 4000 caracteres)
```

---

## 8. GET /api/cliente/322

`2026-09-07T16:01:26.482Z` · status **200** · 117ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente/322' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "id": 322,
  "id_remoto": "493907e3-0cad-4df8-a3d0-250dde9c45e0",
  "nome": "Isadora Sanfins Araujo",
  "telefone": "(11) 91493-7681",
  "telefone_2": null,
  "email": "isasanfins@hotmail.com",
  "convenio_id": null,
  "text_id_convenio": null,
  "categoria": null,
  "endereco": "Rua Luiz Izzo",
  "bairro_id": null,
  "data_nascimento": "1995-01-19",
  "estado_civil": "Casada",
  "profissao": "Head de marketing",
  "cpf": "442.100.988-17",
  "rg": "43744170-2",
  "endereco_numero": "983",
  "endereco_complemento": "Casa 05 - condomínio 01",
  "sexo": 0,
  "pai": null,
  "mae": "Guilherme",
  "valor_default": null,
  "observacao": "Formulário preenchido e enviado pelo cliente em 02/07/2026 - 15:47.",
  "foto": "322.jpg",
  "doencas": null,
  "altura": 160,
  "peso": "55.000",
  "paga_adiantado": 1,
  "informacoes_preliminares": null,
  "situacao": 2,
  "cep": "12929-605",
  "queixas_principais": null,
  "diagnosticos": null,
  "tipo_aluno": 5,
  "domingo": false,
  "segunda": false,
  "terca": false,
  "quarta": false,
  "quinta": false,
  "sexta": false,
  "sabado": false,
  "valor": 0,
  "tipo_atendimento_id": null,
  "sala_id": null,
  "profissional_id_domingo": null,
  "profissional_id_segunda": null,
  "profissional_id_terca": null,
  "profissional_id_quarta": null,
  "profissional_id_quinta": null,
  "profissional_id_sexta": null,
  "profissional_id_sabado": null,
  "hora_domingo": "",
  "hora_segunda": "",
  "hora_terca": "",
  "hora_quarta": "",
  "hora_quinta": "",
  "hora_sexta": "",
  "hora_sabado": "",
  "dia_padrao_renovacao": null,
  "dia_padrao_cobranca": null,
  "procedencia_id": null,
  "imc": null,
  "data_envio_whatsapp_aniversario": null,
  "created_at": "2026-07-02T10:39:31.000000Z",
  "updated_at": "2026-07-02T18:47:56.000000Z",
  "cliente_desde": "2026-07-02",
  "cidade_id": null,
  "telefone_responsavel": "(11) 9985-8982",
  "tipo_cliente": 1,
  "data_inativacao": null,
  "cartao_cidadao": null,
  "nif": null,
  "data_envio_whatsapp_tempo_clinica": null,
  "pacote_fixo_recorrente": 0,
  "sala_id_domingo": null,
  "sala_id_segunda": null,
  "sala_id_terca": null,
  "sala_id_quarta": null,
  "sala_id_quinta": null,
  "sala_id_sexta": null,
  "sala_id_sabado": null,
  "nivel_id": null,
  "mostrar_renovacao_pacote": true,
  "telefone_ddi": "BR",
  "telefone_2_ddi": "BR",
  "telefone_responsavel_ddi": "BR",
  "pacote_fixo_cobranca_automatica": false,
  "pacote_fixo_checkout_stripe": false,
  "uf": "SP",
  "cidade": "Bragança Paulista",
  "bairro": "Quintas de Bragança",
  "data_envio_whatsapp_boas_vindas": null,
  "contrato_atual_id": null,
  "gympass_token": null,
  "documento_identificacao": null,
  "nome_registro": "Isadora Sanfins Araujo",
  "data_conversao": null,
  "data_fechamento_prospeccao": null,
  "data_criacao_prospect": null,
  "moloni_id": null,
  "moloni_servico_id": null,
  "moloni_documento_id": null,
  "moloni_taxa_id": 0,
  "data_ultima_ativacao": null,
  "mostrar_treinos": false,
  "instagram": null,
  "observacao_moloni": null,
  "motivo_procura": null,
  "informações_pedidas": null,
  "forma_contato_prospeccao_id": null,
  "indicacao_interna_id": null,
  "indicacao_externa_nome": null,
  "motivos_nao_efetivacao_id": null,
  "estagio_lead_id": null,
  "usuario_responsavel_lead_id": null,
  "quantidade_reposicoes_por_ciclo": null,
  "ignorar_quantidade_reposicoes_por_ciclo": true,
  "mostrar_faturas": true,
  "total_pass_token": null,
  "permitir_reposicoes_apos_termino": true,
  "sincronizado_desktop": false,
  "acesso_liberado": false,
  "autorizo_uso_imagem": true,
  "data_cadastro_rosto_checkin": null,
  "stripe_customer_id": null,
  "envia_sms_confirmacao": true,
  "observacao_prospeccao": null,
  "convenio_nome": "",
  "procedencia_nome": "",
  "inf_pacote": null,
  "has_pacote_fixo": false,
  "qtd_atendimentos": 15,
  "dados_cobranca": {
    "cliente_id": 322,
    "nome": "Isadora Sanfins Araujo",
    "cpf": "442.100.988-17",
    "data_nascimento": "1995-01-19",
    "email": "is
… (corpo cortado em 4000 caracteres)
```

---

## 9. GET /api/profissional

`2026-09-07T16:01:26.482Z` · status **200** · 113ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/profissional?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 3,
    "nome": "Amanda Mel",
    "email": null,
    "data_nascimento": null,
    "curriculo": null,
    "foto": null,
    "cpf": null,
    "inicio_atendimento": "07:00:00",
    "fim_atendimento": "21:00:00",
    "periodo_atendimento": 60,
    "data_exclusao": null,
    "domingo": false,
    "segunda": true,
    "terca": true,
    "quarta": true,
    "quinta": true,
    "sexta": true,
    "sabado": false,
    "registro": "455512-F",
    "integrar_memed": false,
    "token_memed": null,
    "assinatura_digital_memed": false,
    "conselho_profissional": null,
    "uf_conselho": null,
    "especialidade_memed_id": null,
    "formato_folha": 0,
    "visualizar_meus_atendimentos": true,
    "created_at": "2026-06-23T19:59:41.000000Z",
    "updated_at": "2026-06-24T00:06:41.000000Z",
    "padrao_evolucao_prontuario": "<p><strong>QUEIXAS E RELATOS INICIAIS:</strong></p><p> </p><p><strong>CONDUTA:</strong></p><p> </p>",
    "enviar_whatsapp_automatico": false,
    "cor_agenda": "#ff6f00",
    "tempo_agenda": "01:00:00",
    "exibir_aparelhos_prontuario": true,
    "exibir_exercicios_prontuario": true,
    "campos_prontuario": [
      "peso",
      "altura",
      "imc",
      "… +2 itens (cortado)"
    ],
    "mostrar_pacotes_fixos_futuros": true,
    "tipo_prontuario": "classic",
    "habilita_mapa_aplicacao": 0,
    "servicos_agendamento_online": [],
    "valor_comissionamento": [
      {
        "tipo_atendimento_id": 6,
        "tipo_comissao": null,
        "valor": 0
      },
      {
        "tipo_atendimento_id": 5,
        "tipo_comissao": null,
        "valor": 0
      },
      {
        "tipo_atendimento_id": 7,
        "tipo_comissao": null,
        "valor": 0
      },
      "… +10 itens (cortado)"
    ],
    "versao_prontuario": "MedicalRecord",
    "visualizar_prontuarios": 0,
    "comissoes_personalizadas": [],
    "salas_disponiveis_ids": [
      {
        "id": 1,
        "ativo": true
      }
    ],
    "mostrar_quantidade_vagas": true,
    "bloquear_criacao_agendamentos": false,
    "user": {
      "id": 42923,
      "name": "Amanda Mel",
      "email": "fisio.amandamel@gmail.com",
      "email_verified_at": null,
      "permissao_id": 7637,
      "data_exclusao": null,
      "clinica_id": 9208,
      "profissional_id": 3,
      "data_admissao": "2026-06-16",
      "profissao": "Fisioterapeuta",
      "inativo": false,
      "data_nascimento": null,
      "ordem": 2,
      "visualizacao_atendimento": "profissional",
      "visualizacao_calendario": "timeGridDay",
      "minimizar_menu": 0,
      "foto": null,
      "endereco": null,
      "is_profissional": true,
      "numero": null,
      "complemento": null,
      "bairro": null,
      "cidade": null,
      "estado_id": null,
      "apelido": "Mel",
      "created_at": "2026-06-23T19:59:41.000000Z",
      "updated_at": "2026-06-23T19:59:41.000000Z",
      "receber_email_agenda": false,
      "dark_mode": false,
      "data_aceitou_termo_uso": null,
      "assinatura": null,
      "abrir_modal_notificacao": 1,
      "visualizacao_cor_evento": "status",
      "cep": null,
      "acesso_rapido": [
        0,
        1,
        2,
        "… +3 itens (cortado)"
      ],
      "visualizacao_atendimento_mobile": "profissional",
      "visualizacao_calendario_mobile": "timeGridDay",
      "dark_mode_mobile": false,
      "visualizacao_cor_evento_mobile": "status",
      "invalid_password": false,
      "cpf": null,
      "rg": null,
      "telefone_ddi": "BR",
      "telefone": null,
      "telefone_pessoal_ddi": "BR",
      "telefone_pessoal": null,
      "acessar_unidades": true,
      "nif": null,
      "receber_email_gympass": false,
      "visualizacao_treino_dia": "atendimento",
      "receber_email_total_pass": false,
      "observacoes_gerais": null,
      "pode_realizar_saques": false,
      "idioma_preferencia": null,
      "receber_email_agendamento_online": false,
      "url_avatar": "",
      "url_assinatura": ""
    }
  },
  {
    "id": 1,
 
… (corpo cortado em 4000 caracteres)
```

---

## 10. GET /api/interesse

`2026-09-07T16:01:26.483Z` · status **200** · 96ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/interesse?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 6,
    "nome": "Alivio de Dor",
    "utilizar_no_crm": true,
    "created_at": "2025-04-28T21:11:18.000000Z",
    "updated_at": "2025-04-28T21:11:18.000000Z",
    "interesse_clientes_count": 2,
    "slug_nome": "alivio-de-dor",
    "qtd_clientes": 2
  },
  {
    "id": 5,
    "nome": "Alongamento",
    "utilizar_no_crm": true,
    "created_at": null,
    "updated_at": null,
    "interesse_clientes_count": 0,
    "slug_nome": "alongamento",
    "qtd_clientes": 0
  },
  {
    "id": 4,
    "nome": "Aumento de massa muscular",
    "utilizar_no_crm": true,
    "created_at": null,
    "updated_at": null,
    "interesse_clientes_count": 0,
    "slug_nome": "aumento-de-massa-muscular",
    "qtd_clientes": 0
  },
  "… +4 itens (cortado)"
]
```

---

## 11. GET /api/cliente/322/view-acesso-app-cliente

`2026-09-07T16:01:26.483Z` · status **204** · 138ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente/322/view-acesso-app-cliente' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

_corpo não capturado no HAR (exporte com conteúdo / "with sensitive data")._

---

## 12. GET /api/cliente/322/servicos-pacotes-ativos

`2026-09-07T16:01:26.483Z` · status **200** · 96ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente/322/servicos-pacotes-ativos' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "servicos_recorrentes": 1,
  "pacotes_fixos": 0,
  "pacotes_personalizados": 0
}
```

---

## 13. GET /api/stripe/account/status

`2026-09-07T16:01:26.484Z` · status **200** · 124ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/stripe/account/status' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{}
```

---

## 14. GET /api/stripe/account

`2026-09-07T16:01:26.484Z` · status **200** · 122ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/stripe/account' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "account": null
}
```

---

## 15. GET /api/customer-credit-card/get-cards-by-customer/322

`2026-09-07T16:01:26.651Z` · status **200** · 85ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/customer-credit-card/get-cards-by-customer/322' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[]
```

---

## 16. GET /api/status

`2026-09-07T16:01:29.477Z` · status **200** · 192ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/status?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 1,
    "nome": "Aguardando Chegar",
    "abreviacao": "AC",
    "color": "#64b5f6",
    "class": "blue",
    "ativo": true
  },
  {
    "id": 2,
    "nome": "Em Espera",
    "abreviacao": "EE",
    "color": "#ffd54f",
    "class": "amber",
    "ativo": false
  },
  {
    "id": 3,
    "nome": "Em Atendimento",
    "abreviacao": "EA",
    "color": "#4dd0e1",
    "class": "cyan",
    "ativo": false
  },
  "… +7 itens (cortado)"
]
```

---

## 17. GET /api/tipo-atendimento

`2026-09-07T16:01:29.477Z` · status **200** · 251ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/tipo-atendimento?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 6,
    "nome": "Fisioterapia Sessão",
    "valor_mensal": 0,
    "valor_bimestral": null,
    "valor_trimestral": null,
    "valor_quadrimestral": null,
    "valor_semestral": null,
    "valor_anual": null,
    "tipo_pagamento_pacote": 2,
    "created_at": null,
    "updated_at": "2025-04-28T20:30:06.000000Z",
    "ativo": false,
    "excluir_nps": false,
    "periodo_atendimento": 60,
    "centro_custo_id": 2,
    "is_gympass": false,
    "moloni_id": null,
    "iva_embutido": false,
    "profissional_padrao_id": null,
    "sala_padrao_id": null,
    "agendamento_online": true,
    "agendamento_online_nome_exibicao": null,
    "agendamento_online_mostrar_valor": false,
    "permitir_agendar_novamente": true,
    "nota_fiscal_descricao": null,
    "nota_fiscal_codigo_servico_municipio": null,
    "valor_octomestral": null,
    "codigo_nbs": null,
    "classificacao_tributaria": null,
    "codigo_indicador_operacao": null,
    "codigo_tributacao_nacional": null,
    "prazo_justificar_ausencia_cliente_horas": null,
    "categorias": [
      {
        "id": 1,
        "nome": "Outros",
        "slug": "outros"
      }
    ]
  },
  {
    "id": 5,
    "nome": "Massagem modeladora",
    "valor_mensal": 0,
    "valor_bimestral": null,
    "valor_trimestral": null,
    "valor_quadrimestral": null,
    "valor_semestral": null,
    "valor_anual": null,
    "tipo_pagamento_pacote": 2,
    "created_at": null,
    "updated_at": "2025-04-28T20:30:07.000000Z",
    "ativo": false,
    "excluir_nps": false,
    "periodo_atendimento": 60,
    "centro_custo_id": 3,
    "is_gympass": false,
    "moloni_id": null,
    "iva_embutido": false,
    "profissional_padrao_id": null,
    "sala_padrao_id": null,
    "agendamento_online": true,
    "agendamento_online_nome_exibicao": null,
    "agendamento_online_mostrar_valor": false,
    "permitir_agendar_novamente": true,
    "nota_fiscal_descricao": null,
    "nota_fiscal_codigo_servico_municipio": null,
    "valor_octomestral": null,
    "codigo_nbs": null,
    "classificacao_tributaria": null,
    "codigo_indicador_operacao": null,
    "codigo_tributacao_nacional": null,
    "prazo_justificar_ausencia_cliente_horas": null,
    "categorias": [
      {
        "id": 1,
        "nome": "Outros",
        "slug": "outros"
      }
    ]
  },
  {
    "id": 7,
    "nome": "Personal 2 x semana",
    "valor_mensal": 0,
    "valor_bimestral": null,
    "valor_trimestral": null,
    "valor_quadrimestral": null,
    "valor_semestral": null,
    "valor_anual": null,
    "tipo_pagamento_pacote": 1,
    "created_at": null,
    "updated_at": "2025-04-28T20:30:09.000000Z",
    "ativo": false,
    "excluir_nps": false,
    "periodo_atendimento": 60,
    "centro_custo_id": 4,
    "is_gympass": false,
    "moloni_id": null,
    "iva_embutido": false,
    "profissional_padrao_id": null,
    "sala_padrao_id": null,
    "agendamento_online": true,
    "agendamento_online_nome_exibicao": null,
    "agendamento_online_mostrar_valor": false,
    "permitir_agendar_novamente": true,
    "nota_fiscal_descricao": null,
    "nota_fiscal_codigo_servico_municipio": null,
    "valor_octomestral": null,
    "codigo_nbs": null,
    "classificacao_tributaria": null,
    "codigo_indicador_operacao": null,
    "codigo_tributacao_nacional": null,
    "prazo_justificar_ausencia_cliente_horas": null,
    "categorias": [
      {
        "id": 1,
        "nome": "Outros",
        "slug": "outros"
      }
    ]
  },
  "… +10 itens (cortado)"
]
```

---

## 18. GET /api/sala

`2026-09-07T16:01:29.477Z` · status **200** · 169ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/sala?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 1,
    "nome": "Sala 01",
    "created_at": "2024-11-18T19:52:12.000000Z",
    "updated_at": "2024-11-18T19:52:12.000000Z",
    "color": "#e47603",
    "bloqueada": false,
    "verifica_conflito_horarios": 1,
    "ativo": true
  }
]
```

---

## 19. GET /api/convenio

`2026-09-07T16:01:29.478Z` · status **200** · 170ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/convenio?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[]
```

---

## 20. GET /api/tipo-atendimento

`2026-09-07T16:01:29.478Z` · status **200** · 178ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/tipo-atendimento?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 6,
    "nome": "Fisioterapia Sessão",
    "valor_mensal": 0,
    "valor_bimestral": null,
    "valor_trimestral": null,
    "valor_quadrimestral": null,
    "valor_semestral": null,
    "valor_anual": null,
    "tipo_pagamento_pacote": 2,
    "created_at": null,
    "updated_at": "2025-04-28T20:30:06.000000Z",
    "ativo": false,
    "excluir_nps": false,
    "periodo_atendimento": 60,
    "centro_custo_id": 2,
    "is_gympass": false,
    "moloni_id": null,
    "iva_embutido": false,
    "profissional_padrao_id": null,
    "sala_padrao_id": null,
    "agendamento_online": true,
    "agendamento_online_nome_exibicao": null,
    "agendamento_online_mostrar_valor": false,
    "permitir_agendar_novamente": true,
    "nota_fiscal_descricao": null,
    "nota_fiscal_codigo_servico_municipio": null,
    "valor_octomestral": null,
    "codigo_nbs": null,
    "classificacao_tributaria": null,
    "codigo_indicador_operacao": null,
    "codigo_tributacao_nacional": null,
    "prazo_justificar_ausencia_cliente_horas": null,
    "categorias": [
      {
        "id": 1,
        "nome": "Outros",
        "slug": "outros"
      }
    ]
  },
  {
    "id": 5,
    "nome": "Massagem modeladora",
    "valor_mensal": 0,
    "valor_bimestral": null,
    "valor_trimestral": null,
    "valor_quadrimestral": null,
    "valor_semestral": null,
    "valor_anual": null,
    "tipo_pagamento_pacote": 2,
    "created_at": null,
    "updated_at": "2025-04-28T20:30:07.000000Z",
    "ativo": false,
    "excluir_nps": false,
    "periodo_atendimento": 60,
    "centro_custo_id": 3,
    "is_gympass": false,
    "moloni_id": null,
    "iva_embutido": false,
    "profissional_padrao_id": null,
    "sala_padrao_id": null,
    "agendamento_online": true,
    "agendamento_online_nome_exibicao": null,
    "agendamento_online_mostrar_valor": false,
    "permitir_agendar_novamente": true,
    "nota_fiscal_descricao": null,
    "nota_fiscal_codigo_servico_municipio": null,
    "valor_octomestral": null,
    "codigo_nbs": null,
    "classificacao_tributaria": null,
    "codigo_indicador_operacao": null,
    "codigo_tributacao_nacional": null,
    "prazo_justificar_ausencia_cliente_horas": null,
    "categorias": [
      {
        "id": 1,
        "nome": "Outros",
        "slug": "outros"
      }
    ]
  },
  {
    "id": 7,
    "nome": "Personal 2 x semana",
    "valor_mensal": 0,
    "valor_bimestral": null,
    "valor_trimestral": null,
    "valor_quadrimestral": null,
    "valor_semestral": null,
    "valor_anual": null,
    "tipo_pagamento_pacote": 1,
    "created_at": null,
    "updated_at": "2025-04-28T20:30:09.000000Z",
    "ativo": false,
    "excluir_nps": false,
    "periodo_atendimento": 60,
    "centro_custo_id": 4,
    "is_gympass": false,
    "moloni_id": null,
    "iva_embutido": false,
    "profissional_padrao_id": null,
    "sala_padrao_id": null,
    "agendamento_online": true,
    "agendamento_online_nome_exibicao": null,
    "agendamento_online_mostrar_valor": false,
    "permitir_agendar_novamente": true,
    "nota_fiscal_descricao": null,
    "nota_fiscal_codigo_servico_municipio": null,
    "valor_octomestral": null,
    "codigo_nbs": null,
    "classificacao_tributaria": null,
    "codigo_indicador_operacao": null,
    "codigo_tributacao_nacional": null,
    "prazo_justificar_ausencia_cliente_horas": null,
    "categorias": [
      {
        "id": 1,
        "nome": "Outros",
        "slug": "outros"
      }
    ]
  },
  "… +10 itens (cortado)"
]
```

---

## 21. GET /api/profissional/todos-profissionais

`2026-09-07T16:01:29.478Z` · status **200** · 171ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/profissional/todos-profissionais' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 1,
    "nome": "Pri Savoia",
    "ativo": true
  },
  {
    "id": 2,
    "nome": "Andressa Lopes Gonçalves",
    "ativo": false
  },
  {
    "id": 3,
    "nome": "Amanda Mel",
    "ativo": true
  }
]
```

---

## 22. GET /api/atendimento

`2026-09-07T16:01:29.479Z` · status **200** · 231ms

### Query params

| Param | Valor |
| --- | --- |
| `page` | `1` |
| `rowsPerPage` | `5` |
| `descending` | `true` |
| `filterWhere%5Bcliente_id%5D` | `322` |
| `filterWhere%5Bavulso%5D` | `true` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/atendimento?page=1&rowsPerPage=5&descending=true&filterWhere%5Bcliente_id%5D=322&filterWhere%5Bavulso%5D=true' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "current_page": 1,
  "data": [
    {
      "id": 10898,
      "cliente_id": 322,
      "profissional_id": 1,
      "data_atendimento": "2026-07-02",
      "hora_atendimento": "10:00:00",
      "hora_final_atendimento": "10:50:00",
      "hora_chegada": null,
      "status_id": 4,
      "convenio_id": null,
      "valor": 0,
      "obs": null,
      "tipo_atendimento_id": 11,
      "pago": 0,
      "sala_id": 1,
      "pacote_id": null,
      "ordem_pacote": null,
      "arquivos": null,
      "prontuario_finalizado": true,
      "prontuario_preenchido_em": null,
      "reaberto_troca_plano": false,
      "motivo_reabertura_troca_plano": null,
      "aula_experimental": false,
      "forma_pagamento_id": null,
      "pacote_fixo_id": null,
      "acompanhante": null,
      "remarcado_id": null,
      "confirmado": false,
      "data_confirmacao_user": null,
      "data_confirmacao_cliente": null,
      "data_confirmacao_checkin_gympass": null,
      "data_confirmacao_cliente_app": null,
      "data_cancelamento_cliente_app": null,
      "justificativa_cancelamento_cliente": null,
      "peso": null,
      "altura": null,
      "perimetro_cefalico": null,
      "qt_email_enviado": 0,
      "imc": null,
      "whatsapp_enviado": false,
      "nao_descontar_comissao": 0,
      "created_at": "2026-07-02T10:39:42.000000Z",
      "updated_at": "2026-07-03T16:12:15.000000Z",
      "circunferencia_cintura": null,
      "circunferencia_abdominal": null,
      "whatsapp_automatico_enviado": 0,
      "whatsapp_lembrete_enviado": 0,
      "created_by_user_id": 21714,
      "agendamento_online": false,
      "percentual_gordura": null,
      "percentual_massa_magra": null,
      "flexibilidade": null,
      "atendimento_combo_id": null,
      "circunferencia_umbilical": null,
      "circunferencia_umbilical_acima": null,
      "circunferencia_umbilical_abaixo": null,
      "peso_massa_gorda": null,
      "peso_massa_magra": null,
      "gordura_visceral": null,
      "taxa_metabolica": null,
      "coxa_direita": null,
      "coxa_esquerda": null,
      "panturrilha_direita": null,
      "panturrilha_esquerda": null,
      "braco_direito": null,
      "braco_esquerdo": null,
      "circunferencia_quadril": null,
      "servico_ciclo_id": null,
      "slot_id": null,
      "data_remarcacao_cliente_app": null,
      "booking_number": null,
      "data_agendamento_cliente_app": null,
      "utiliza_total_pass": false,
      "data_confirmacao_total_pass": null,
      "turma_slot_id": null,
      "desmarcado": false,
      "aparelhos": [],
      "email_automatico_enviado": 0,
      "origem_agendamento": "sistema",
      "origem_confirmacao": "",
      "data_hora_confirmacao": null,
      "auditoria_checkin_facial_id": null,
      "whatsapp_lembrete_job_id": null,
      "pressao_arterial_sistolica": null,
      "pressao_arterial_diastolica": null,
      "conta_receber_valor": 50,
      "conta_receber_pago": "1",
      "data_hora_inicial": "2026-07-02 10:00:00",
      "status": {
        "id": 4,
        "nome": "Finalizado",
        "abreviacao": "FI",
        "color": "#81c784",
        "class": "green",
        "ativo": true
      },
      "gerar_conta": false,
      "gerar_conta_combo": true,
      "prontuario_vazio": true,
      "tipo_valor": 50,
      "tipo": {
        "id": 11,
        "nome": "Sessão Avaliação",
        "valor_mensal": 50,
        "valor_bimestral": null,
        "valor_trimestral": null,
        "valor_quadrimestral": null,
        "valor_semestral": null,
        "valor_anual": null,
        "tipo_pagamento_pacote": 2,
        "created_at": "2025-04-28T20:43:44.000000Z",
        "updated_at": "2025-07-07T15:56:08.000000Z",
        "ativo": true,
        "excluir_nps": false,
        "periodo_atendimento": 50,
        "centro_custo_id": 1,
        "is_gympass": false,
        "moloni_id": null,
        "iva_embutido": false,
        "profissional_padrao_id": null,
        "sala_padrao_id": null,
        "agendamento_o
… (corpo cortado em 4000 caracteres)
```

---

## 23. GET /api/cliente-servico/125

`2026-09-07T16:01:40.590Z` · status **200** · 114ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente-servico/125' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "id": 125,
  "cliente_id": 322,
  "tipo_atendimento_id": 8,
  "periodicidade": 6,
  "dia_padrao_renovacao": 2,
  "qtd_dias_efetuar_pagamento": null,
  "inicio_servico": "2026-07-02",
  "domingo": false,
  "segunda": false,
  "terca": false,
  "quarta": false,
  "quinta": true,
  "sexta": false,
  "sabado": false,
  "hora_domingo": "",
  "hora_segunda": "",
  "hora_terca": "",
  "hora_quarta": "",
  "hora_quinta": "10:00",
  "hora_sexta": "",
  "hora_sabado": "",
  "profissional_id_domingo": null,
  "profissional_id_segunda": null,
  "profissional_id_terca": null,
  "profissional_id_quarta": null,
  "profissional_id_quinta": 1,
  "profissional_id_sexta": null,
  "profissional_id_sabado": null,
  "sala_id_domingo": null,
  "sala_id_segunda": null,
  "sala_id_terca": null,
  "sala_id_quarta": null,
  "sala_id_quinta": 1,
  "sala_id_sexta": null,
  "sala_id_sabado": null,
  "created_at": "2026-07-02T18:41:06.000000Z",
  "updated_at": "2026-08-12T08:16:28.000000Z",
  "data_pause": null,
  "observacao": "<br />Gerado novo ciclo em 02/07/26 pelo usuário Pri Savoia<br />Gerado novo ciclo em 12/07/26 pelo sistema<br />Gerado novo ciclo em 12/08/26 pelo sistema",
  "created_by_user_id": 21714,
  "possui_dias_fixos": true,
  "percentual_desconto": "0.0000",
  "data_encerramento": "2027-01-01",
  "forma_pagamento": null,
  "cobranca_automatica": false,
  "servico_gratis": false,
  "cartao_credito_id": null,
  "stripe_payment_method_id": null,
  "quantidade_reposicoes_por_ciclo": 0,
  "ignorar_quantidade_reposicoes_por_ciclo": true,
  "total_atendimentos_ciclo": null,
  "total_atendimentos_semanais_ciclo": null,
  "nome_exibicao_tipo_atendimento": "Pilates 1x na Semana",
  "profissional_preferencia_id": null,
  "congelar_valor": true,
  "valor_congelado": 200,
  "dia_padrao_cobranca": 2,
  "permitir_justificar_ausencia_app_checkin": true,
  "emissao_nota_fiscal_automatica": false,
  "permitir_reposicoes_apos_termino": false,
  "nome": "Pilates 1x na Semana",
  "count_faturas_vencidas": 1,
  "is_encerrado": false
}
```

---

## 24. GET /api/servico-ciclo

`2026-09-07T16:01:40.591Z` · status **200** · 103ms

### Query params

| Param | Valor |
| --- | --- |
| `page` | `1` |
| `rowsPerPage` | `20` |
| `descending` | `true` |
| `servico_id` | `125` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/servico-ciclo?page=1&rowsPerPage=20&descending=true&servico_id=125' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "current_page": 1,
  "data": [
    {
      "id": 620,
      "servico_id": 125,
      "qtd_atendimentos": 5,
      "data_inicio": "2026-09-02",
      "data_fim": "2026-10-01",
      "created_at": "2026-08-12T08:16:28.000000Z",
      "updated_at": "2026-08-12T08:16:28.000000Z",
      "conta_receber_id": 805,
      "valor": 200,
      "pago": 0,
      "data_vencimento": "2026-09-02",
      "data_recebimento": null,
      "qtd_aulas_feitas": 1,
      "valor_bruto": 200,
      "qtd_aguardando_reposicao": null
    },
    {
      "id": 561,
      "servico_id": 125,
      "qtd_atendimentos": 4,
      "data_inicio": "2026-08-02",
      "data_fim": "2026-09-01",
      "created_at": "2026-07-12T08:39:26.000000Z",
      "updated_at": "2026-07-12T08:39:26.000000Z",
      "conta_receber_id": 734,
      "valor": 200,
      "pago": 1,
      "data_vencimento": "2026-08-02",
      "data_recebimento": "2026-08-14",
      "qtd_aulas_feitas": 4,
      "valor_bruto": 200,
      "qtd_aguardando_reposicao": null
    },
    {
      "id": 541,
      "servico_id": 125,
      "qtd_atendimentos": 5,
      "data_inicio": "2026-07-02",
      "data_fim": "2026-08-01",
      "created_at": "2026-07-02T18:41:06.000000Z",
      "updated_at": "2026-07-02T18:41:06.000000Z",
      "conta_receber_id": 708,
      "valor": 150,
      "pago": 1,
      "data_vencimento": "2026-07-02",
      "data_recebimento": "2026-07-20",
      "qtd_aulas_feitas": 5,
      "valor_bruto": 150,
      "qtd_aguardando_reposicao": "1"
    }
  ],
  "first_page_url": "https://api.seufisio.com.br/api/servico-ciclo?page=1",
  "from": 1,
  "last_page": 1,
  "last_page_url": "https://api.seufisio.com.br/api/servico-ciclo?page=1",
  "links": [
    {
      "url": null,
      "label": "« Anterior",
      "page": null,
      "active": false
    },
    {
      "url": "https://api.seufisio.com.br/api/servico-ciclo?page=1",
      "label": "1",
      "page": 1,
      "active": true
    },
    {
      "url": null,
      "label": "Próximo »",
      "page": null,
      "active": false
    }
  ],
  "next_page_url": null,
  "path": "https://api.seufisio.com.br/api/servico-ciclo",
  "per_page": 20,
  "prev_page_url": null,
  "to": 3,
  "total": 3
}
```

---

## 25. GET /api/cliente-servico/primeiro-ciclo/125

`2026-09-07T16:01:40.591Z` · status **200** · 96ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente-servico/primeiro-ciclo/125' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "servico_id": 125,
  "qtd_aulas_feitas": 5
}
```

---

## 26. GET /api/cliente-servico/ultimo-ciclo/125

`2026-09-07T16:01:40.736Z` · status **200** · 93ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente-servico/ultimo-ciclo/125' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "id": 620,
  "servico_id": 125,
  "qtd_atendimentos": 5,
  "data_inicio": "2026-09-02",
  "data_fim": "2026-10-01",
  "created_at": "2026-08-12T08:16:28.000000Z",
  "updated_at": "2026-08-12T08:16:28.000000Z"
}
```

---

## 27. GET /api/convenio

`2026-09-07T16:01:40.762Z` · status **200** · 61ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/convenio?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[]
```

---

## 28. GET /api/customer-credit-card/get-cards-by-customer/322

`2026-09-07T16:01:45.623Z` · status **200** · 92ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/customer-credit-card/get-cards-by-customer/322' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[]
```

---

## 29. GET /api/cliente-servico/ultimo-ciclo/125

`2026-09-07T16:01:45.623Z` · status **200** · 92ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente-servico/ultimo-ciclo/125' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "id": 620,
  "servico_id": 125,
  "qtd_atendimentos": 5,
  "data_inicio": "2026-09-02",
  "data_fim": "2026-10-01",
  "created_at": "2026-08-12T08:16:28.000000Z",
  "updated_at": "2026-08-12T08:16:28.000000Z"
}
```

---

## 30. GET /api/tipo-atendimento/8

`2026-09-07T16:01:45.623Z` · status **200** · 108ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/tipo-atendimento/8' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "id": 8,
  "nome": "Pilates 1x na Semana",
  "valor_mensal": 290,
  "valor_bimestral": null,
  "valor_trimestral": 600,
  "valor_quadrimestral": null,
  "valor_semestral": 1200,
  "valor_anual": null,
  "tipo_pagamento_pacote": 1,
  "created_at": "2025-04-28T20:37:16.000000Z",
  "updated_at": "2025-07-03T16:57:05.000000Z",
  "ativo": true,
  "excluir_nps": false,
  "periodo_atendimento": 50,
  "centro_custo_id": 1,
  "is_gympass": false,
  "moloni_id": null,
  "iva_embutido": false,
  "profissional_padrao_id": null,
  "sala_padrao_id": null,
  "agendamento_online": true,
  "agendamento_online_nome_exibicao": "Pilates 1x na Semana Mensal",
  "agendamento_online_mostrar_valor": true,
  "permitir_agendar_novamente": true,
  "nota_fiscal_descricao": null,
  "nota_fiscal_codigo_servico_municipio": null,
  "valor_octomestral": null,
  "codigo_nbs": null,
  "classificacao_tributaria": null,
  "codigo_indicador_operacao": null,
  "codigo_tributacao_nacional": null,
  "prazo_justificar_ausencia_cliente_horas": null,
  "categorias": [
    {
      "id": 1,
      "nome": "Outros",
      "slug": "outros"
    }
  ]
}
```

---

## 31. GET /api/user

`2026-09-07T16:01:45.624Z` · status **200** · 104ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/user?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 42923,
    "name": "Amanda Mel",
    "email": "fisio.amandamel@gmail.com",
    "email_verified_at": null,
    "permissao_id": 7637,
    "data_exclusao": null,
    "clinica_id": 9208,
    "profissional_id": 3,
    "data_admissao": "2026-06-16",
    "profissao": "Fisioterapeuta",
    "inativo": false,
    "data_nascimento": null,
    "ordem": 2,
    "visualizacao_atendimento": "profissional",
    "visualizacao_calendario": "timeGridDay",
    "minimizar_menu": 0,
    "foto": null,
    "endereco": null,
    "is_profissional": true,
    "numero": null,
    "complemento": null,
    "bairro": null,
    "cidade": null,
    "estado_id": null,
    "apelido": "Mel",
    "created_at": "2026-06-23T19:59:41.000000Z",
    "updated_at": "2026-06-23T19:59:41.000000Z",
    "receber_email_agenda": false,
    "dark_mode": false,
    "data_aceitou_termo_uso": null,
    "assinatura": null,
    "abrir_modal_notificacao": 1,
    "visualizacao_cor_evento": "status",
    "cep": null,
    "acesso_rapido": [
      0,
      1,
      2,
      "… +3 itens (cortado)"
    ],
    "visualizacao_atendimento_mobile": "profissional",
    "visualizacao_calendario_mobile": "timeGridDay",
    "dark_mode_mobile": false,
    "visualizacao_cor_evento_mobile": "status",
    "invalid_password": false,
    "cpf": null,
    "rg": null,
    "telefone_ddi": "BR",
    "telefone": null,
    "telefone_pessoal_ddi": "BR",
    "telefone_pessoal": null,
    "acessar_unidades": true,
    "nif": null,
    "receber_email_gympass": false,
    "visualizacao_treino_dia": "atendimento",
    "receber_email_total_pass": false,
    "observacoes_gerais": null,
    "pode_realizar_saques": false,
    "idioma_preferencia": null,
    "receber_email_agendamento_online": false,
    "url_avatar": "",
    "url_assinatura": "",
    "permissao": {
      "id": 7637,
      "titulo": "Profissionais",
      "clinica_id": 9208,
      "created_at": null,
      "updated_at": null,
      "modulos": [
        "alterar_status_atendimento",
        "fazer_evolucao",
        "editar_atendimento",
        "… +10 itens (cortado)"
      ]
    },
    "profissional": {
      "id": 3,
      "nome": "Amanda Mel",
      "email": null,
      "data_nascimento": null,
      "curriculo": null,
      "foto": null,
      "cpf": null,
      "inicio_atendimento": "07:00:00",
      "fim_atendimento": "21:00:00",
      "periodo_atendimento": 60,
      "data_exclusao": null,
      "domingo": false,
      "segunda": true,
      "terca": true,
      "quarta": true,
      "quinta": true,
      "sexta": true,
      "sabado": false,
      "registro": "455512-F",
      "integrar_memed": false,
      "token_memed": null,
      "assinatura_digital_memed": false,
      "conselho_profissional": null,
      "uf_conselho": null,
      "especialidade_memed_id": null,
      "formato_folha": 0,
      "visualizar_meus_atendimentos": true,
      "created_at": "2026-06-23T19:59:41.000000Z",
      "updated_at": "2026-06-24T00:06:41.000000Z",
      "padrao_evolucao_prontuario": "<p><strong>QUEIXAS E RELATOS INICIAIS:</strong></p><p> </p><p><strong>CONDUTA:</strong></p><p> </p>",
      "enviar_whatsapp_automatico": false,
      "cor_agenda": "#ff6f00",
      "tempo_agenda": "01:00:00",
      "exibir_aparelhos_prontuario": true,
      "exibir_exercicios_prontuario": true,
      "campos_prontuario": [
        "peso",
        "altura",
        "imc",
        "… +2 itens (cortado)"
      ],
      "mostrar_pacotes_fixos_futuros": true,
      "tipo_prontuario": "classic",
      "habilita_mapa_aplicacao": 0,
      "servicos_agendamento_online": [],
      "valor_comissionamento": [
        {
          "tipo_atendimento_id": 6,
          "tipo_comissao": null,
          "valor": 0
        },
        {
          "tipo_atendimento_id": 5,
          "tipo_comissao": null,
          "valor": 0
        },
        {
          "tipo_atendimento_id": 7,
          "tipo_comissao": null,
          "valor": 0
        },
        "… +10 itens (cortado)"
     
… (corpo cortado em 4000 caracteres)
```

---

## 32. GET /api/user

`2026-09-07T16:02:10.067Z` · status **200** · 82ms

### Query params

| Param | Valor |
| --- | --- |
| `rowsPerPage` | `all` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/user?rowsPerPage=all' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
[
  {
    "id": 42923,
    "name": "Amanda Mel",
    "email": "fisio.amandamel@gmail.com",
    "email_verified_at": null,
    "permissao_id": 7637,
    "data_exclusao": null,
    "clinica_id": 9208,
    "profissional_id": 3,
    "data_admissao": "2026-06-16",
    "profissao": "Fisioterapeuta",
    "inativo": false,
    "data_nascimento": null,
    "ordem": 2,
    "visualizacao_atendimento": "profissional",
    "visualizacao_calendario": "timeGridDay",
    "minimizar_menu": 0,
    "foto": null,
    "endereco": null,
    "is_profissional": true,
    "numero": null,
    "complemento": null,
    "bairro": null,
    "cidade": null,
    "estado_id": null,
    "apelido": "Mel",
    "created_at": "2026-06-23T19:59:41.000000Z",
    "updated_at": "2026-06-23T19:59:41.000000Z",
    "receber_email_agenda": false,
    "dark_mode": false,
    "data_aceitou_termo_uso": null,
    "assinatura": null,
    "abrir_modal_notificacao": 1,
    "visualizacao_cor_evento": "status",
    "cep": null,
    "acesso_rapido": [
      0,
      1,
      2,
      "… +3 itens (cortado)"
    ],
    "visualizacao_atendimento_mobile": "profissional",
    "visualizacao_calendario_mobile": "timeGridDay",
    "dark_mode_mobile": false,
    "visualizacao_cor_evento_mobile": "status",
    "invalid_password": false,
    "cpf": null,
    "rg": null,
    "telefone_ddi": "BR",
    "telefone": null,
    "telefone_pessoal_ddi": "BR",
    "telefone_pessoal": null,
    "acessar_unidades": true,
    "nif": null,
    "receber_email_gympass": false,
    "visualizacao_treino_dia": "atendimento",
    "receber_email_total_pass": false,
    "observacoes_gerais": null,
    "pode_realizar_saques": false,
    "idioma_preferencia": null,
    "receber_email_agendamento_online": false,
    "url_avatar": "",
    "url_assinatura": "",
    "permissao": {
      "id": 7637,
      "titulo": "Profissionais",
      "clinica_id": 9208,
      "created_at": null,
      "updated_at": null,
      "modulos": [
        "alterar_status_atendimento",
        "fazer_evolucao",
        "editar_atendimento",
        "… +10 itens (cortado)"
      ]
    },
    "profissional": {
      "id": 3,
      "nome": "Amanda Mel",
      "email": null,
      "data_nascimento": null,
      "curriculo": null,
      "foto": null,
      "cpf": null,
      "inicio_atendimento": "07:00:00",
      "fim_atendimento": "21:00:00",
      "periodo_atendimento": 60,
      "data_exclusao": null,
      "domingo": false,
      "segunda": true,
      "terca": true,
      "quarta": true,
      "quinta": true,
      "sexta": true,
      "sabado": false,
      "registro": "455512-F",
      "integrar_memed": false,
      "token_memed": null,
      "assinatura_digital_memed": false,
      "conselho_profissional": null,
      "uf_conselho": null,
      "especialidade_memed_id": null,
      "formato_folha": 0,
      "visualizar_meus_atendimentos": true,
      "created_at": "2026-06-23T19:59:41.000000Z",
      "updated_at": "2026-06-24T00:06:41.000000Z",
      "padrao_evolucao_prontuario": "<p><strong>QUEIXAS E RELATOS INICIAIS:</strong></p><p> </p><p><strong>CONDUTA:</strong></p><p> </p>",
      "enviar_whatsapp_automatico": false,
      "cor_agenda": "#ff6f00",
      "tempo_agenda": "01:00:00",
      "exibir_aparelhos_prontuario": true,
      "exibir_exercicios_prontuario": true,
      "campos_prontuario": [
        "peso",
        "altura",
        "imc",
        "… +2 itens (cortado)"
      ],
      "mostrar_pacotes_fixos_futuros": true,
      "tipo_prontuario": "classic",
      "habilita_mapa_aplicacao": 0,
      "servicos_agendamento_online": [],
      "valor_comissionamento": [
        {
          "tipo_atendimento_id": 6,
          "tipo_comissao": null,
          "valor": 0
        },
        {
          "tipo_atendimento_id": 5,
          "tipo_comissao": null,
          "valor": 0
        },
        {
          "tipo_atendimento_id": 7,
          "tipo_comissao": null,
          "valor": 0
        },
        "… +10 itens (cortado)"
     
… (corpo cortado em 4000 caracteres)
```

---

## 33. PUT /api/cliente-servico/125

`2026-09-07T16:02:19.215Z` · status **200** · 105ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente-servico/125' \
  -X PUT \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'content-type: application/json' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34' \
  --data-raw '{"id":125,"cliente_id":322,"tipo_atendimento_id":8,"periodicidade":6,"dia_padrao_renovacao":2,"qtd_dias_efetuar_pagamento":null,"inicio_servico":"2026-07-02","domingo":false,"segunda":false,"terca":false,"quarta":false,"quinta":true,"sexta":false,"sabado":false,"hora_domingo":"","hora_segunda":"","hora_terca":"","hora_quarta":"","hora_quinta":"10:00","hora_sexta":"","hora_sabado":"","profissional_id_domingo":null,"profissional_id_segunda":null,"profissional_id_terca":null,"profissional_id_quarta":null,"profissional_id_quinta":1,"profissional_id_sexta":null,"profissional_id_sabado":null,"sala_id_domingo":null,"sala_id_segunda":null,"sala_id_terca":null,"sala_id_quarta":null,"sala_id_quinta":1,"sala_id_sexta":null,"sala_id_sabado":null,"created_at":"2026-07-02T18:41:06.000000Z","updated_at":"2026-08-12T08:16:28.000000Z","data_pause":null,"observacao":"<br />Gerado novo ciclo em 02/07/26 pelo usuário Pri Savoia<br />Gerado novo ciclo em 12/07/26 pelo sistema<br />Gerado novo ciclo em 12/08/26 pelo sistema","created_by_user_id":21714,"possui_dias_fixos":true,"percentual_desconto":0,"data_encerramento":"01/2027","forma_pagamento":null,"cobranca_automatica":false,"servico_gratis":false,"cartao_credito_id":null,"stripe_payment_method_id":null,"quantidade_reposicoes_por_ciclo":0,"ignorar_quantidade_reposicoes_por_ciclo":true,"total_atendimentos_ciclo":null,"total_atendimentos_semanais_ciclo":null,"nome_exibicao_tipo_atendimento":"Pilates 1x na Semana","profissional_preferencia_id":null,"congelar_valor":true,"valor_congelado":200,"dia_padrao_cobranca":"15","permitir_justificar_ausencia_app_checkin":true,"emissao_nota_fiscal_automatica":false,"permitir_reposicoes_apos_termino":false,"nome":"Pilates 1x na Semana","count_faturas_vencidas":1,"is_encerrado":false,"possui_data_encerramento":true}'
```

#### Body

```JSON
{
  "id": 125,
  "cliente_id": 322,
  "tipo_atendimento_id": 8,
  "periodicidade": 6,
  "dia_padrao_renovacao": 2,
  "qtd_dias_efetuar_pagamento": null,
  "inicio_servico": "2026-07-02",
  "domingo": false,
  "segunda": false,
  "terca": false,
  "quarta": false,
  "quinta": true,
  "sexta": false,
  "sabado": false,
  "hora_domingo": "",
  "hora_segunda": "",
  "hora_terca": "",
  "hora_quarta": "",
  "hora_quinta": "10:00",
  "hora_sexta": "",
  "hora_sabado": "",
  "profissional_id_domingo": null,
  "profissional_id_segunda": null,
  "profissional_id_terca": null,
  "profissional_id_quarta": null,
  "profissional_id_quinta": 1,
  "profissional_id_sexta": null,
  "profissional_id_sabado": null,
  "sala_id_domingo": null,
  "sala_id_segunda": null,
  "sala_id_terca": null,
  "sala_id_quarta": null,
  "sala_id_quinta": 1,
  "sala_id_sexta": null,
  "sala_id_sabado": null,
  "created_at": "2026-07-02T18:41:06.000000Z",
  "updated_at": "2026-08-12T08:16:28.000000Z",
  "data_pause": null,
  "observacao": "<br />Gerado novo ciclo em 02/07/26 pelo usuário Pri Savoia<br />Gerado novo ciclo em 12/07/26 pelo sistema<br />Gerado novo ciclo em 12/08/26 pelo sistema",
  "created_by_user_id": 21714,
  "possui_dias_fixos": true,
  "percentual_desconto": 0,
  "data_encerramento": "01/2027",
  "forma_pagamento": null,
  "cobranca_automatica": false,
  "servico_gratis": false,
  "cartao_credito_id": null,
  "stripe_payment_method_id": null,
  "quantidade_reposicoes_por_ciclo": 0,
  "ignorar_quantidade_reposicoes_por_ciclo": true,
  "total_atendimentos_ciclo": null,
  "total_atendimentos_semanais_ciclo": null,
  "nome_exibicao_tipo_atendimento": "Pilates 1x na Semana",
  "profissional_preferencia_id": null,
  "congelar_valor": true,
  "valor_congelado": 200,
  "dia_padrao_cobranca": "15",
  "permitir_justificar_ausencia_app_checkin": true,
  "emissao_nota_fiscal_automatica": false,
  "permitir_reposicoes_apos_termino": false,
  "nome": "Pilates 1x na Semana",
  "count_faturas_vencidas": 1,
  "is_encerrado": false,
  "possui_data_encerramento": true
}
```

### Response

```JSON
{
  "success": true
}
```

---

## 34. GET /api/cliente/322/listar-vendas

`2026-09-07T16:02:19.334Z` · status **200** · 69ms

### Query params

| Param | Valor |
| --- | --- |
| `tab` | `ativas` |
| `page` | `1` |
| `per_page` | `6` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente/322/listar-vendas?tab=ativas&page=1&per_page=6' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "data": [
    {
      "id": 125,
      "cicloId": 620,
      "tipoVenda": "servico_recorrente",
      "tipoAtendimentoNome": "Pilates 1x na Semana",
      "dataInicial": "2026-07-02",
      "validade": "2027-01-01",
      "atendimentosFeitos": 9,
      "atendimentosContratados": 0,
      "atendimentosRepor": 1,
      "valor": 200,
      "notaFiscalAutomatica": false,
      "cobrancaAutomatica": false,
      "informacoes": [
        "Quinta às 10:00, com Pri S. na sala Sala 01"
      ],
      "tipoAtendimentoId": 8,
      "periodicidade": 6,
      "periodicidadeLabel": null,
      "dataPause": null
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 6,
    "total": 1,
    "last_page": 1
  }
}
```

---

## 35. GET /api/cliente-servico/125

`2026-09-07T16:02:19.334Z` · status **200** · 78ms

### Request

```CURL
curl 'https://api.seufisio.com.br/api/cliente-servico/125' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "id": 125,
  "cliente_id": 322,
  "tipo_atendimento_id": 8,
  "periodicidade": 6,
  "dia_padrao_renovacao": 2,
  "qtd_dias_efetuar_pagamento": null,
  "inicio_servico": "2026-07-02",
  "domingo": false,
  "segunda": false,
  "terca": false,
  "quarta": false,
  "quinta": true,
  "sexta": false,
  "sabado": false,
  "hora_domingo": "",
  "hora_segunda": "",
  "hora_terca": "",
  "hora_quarta": "",
  "hora_quinta": "10:00",
  "hora_sexta": "",
  "hora_sabado": "",
  "profissional_id_domingo": null,
  "profissional_id_segunda": null,
  "profissional_id_terca": null,
  "profissional_id_quarta": null,
  "profissional_id_quinta": 1,
  "profissional_id_sexta": null,
  "profissional_id_sabado": null,
  "sala_id_domingo": null,
  "sala_id_segunda": null,
  "sala_id_terca": null,
  "sala_id_quarta": null,
  "sala_id_quinta": 1,
  "sala_id_sexta": null,
  "sala_id_sabado": null,
  "created_at": "2026-07-02T18:41:06.000000Z",
  "updated_at": "2026-09-07T16:02:19.000000Z",
  "data_pause": null,
  "observacao": "<br />Gerado novo ciclo em 02/07/26 pelo usuário Pri Savoia<br />Gerado novo ciclo em 12/07/26 pelo sistema<br />Gerado novo ciclo em 12/08/26 pelo sistema",
  "created_by_user_id": 21714,
  "possui_dias_fixos": true,
  "percentual_desconto": "0.0000",
  "data_encerramento": "2027-01-01",
  "forma_pagamento": null,
  "cobranca_automatica": false,
  "servico_gratis": false,
  "cartao_credito_id": null,
  "stripe_payment_method_id": null,
  "quantidade_reposicoes_por_ciclo": 0,
  "ignorar_quantidade_reposicoes_por_ciclo": true,
  "total_atendimentos_ciclo": null,
  "total_atendimentos_semanais_ciclo": null,
  "nome_exibicao_tipo_atendimento": "Pilates 1x na Semana",
  "profissional_preferencia_id": null,
  "congelar_valor": true,
  "valor_congelado": 200,
  "dia_padrao_cobranca": 15,
  "permitir_justificar_ausencia_app_checkin": true,
  "emissao_nota_fiscal_automatica": false,
  "permitir_reposicoes_apos_termino": false,
  "nome": "Pilates 1x na Semana",
  "count_faturas_vencidas": 1,
  "is_encerrado": false
}
```

---

## 36. GET /api/servico-ciclo

`2026-09-07T16:02:19.334Z` · status **200** · 68ms

### Query params

| Param | Valor |
| --- | --- |
| `page` | `1` |
| `rowsPerPage` | `20` |
| `descending` | `true` |
| `servico_id` | `125` |

### Request

```CURL
curl 'https://api.seufisio.com.br/api/servico-ciclo?page=1&rowsPerPage=20&descending=true&servico_id=125' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'acesso: web-desktop' \
  -H 'origin: https://app.seufisio.com.br' \
  -H 'referer: https://app.seufisio.com.br/' \
  -H 'setfisio: 9208' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-version-app: 34'
```

### Response

```JSON
{
  "current_page": 1,
  "data": [
    {
      "id": 620,
      "servico_id": 125,
      "qtd_atendimentos": 5,
      "data_inicio": "2026-09-02",
      "data_fim": "2026-10-01",
      "created_at": "2026-08-12T08:16:28.000000Z",
      "updated_at": "2026-08-12T08:16:28.000000Z",
      "conta_receber_id": 805,
      "valor": 200,
      "pago": 0,
      "data_vencimento": "2026-09-02",
      "data_recebimento": null,
      "qtd_aulas_feitas": 1,
      "valor_bruto": 200,
      "qtd_aguardando_reposicao": null
    },
    {
      "id": 561,
      "servico_id": 125,
      "qtd_atendimentos": 4,
      "data_inicio": "2026-08-02",
      "data_fim": "2026-09-01",
      "created_at": "2026-07-12T08:39:26.000000Z",
      "updated_at": "2026-07-12T08:39:26.000000Z",
      "conta_receber_id": 734,
      "valor": 200,
      "pago": 1,
      "data_vencimento": "2026-08-02",
      "data_recebimento": "2026-08-14",
      "qtd_aulas_feitas": 4,
      "valor_bruto": 200,
      "qtd_aguardando_reposicao": null
    },
    {
      "id": 541,
      "servico_id": 125,
      "qtd_atendimentos": 5,
      "data_inicio": "2026-07-02",
      "data_fim": "2026-08-01",
      "created_at": "2026-07-02T18:41:06.000000Z",
      "updated_at": "2026-07-02T18:41:06.000000Z",
      "conta_receber_id": 708,
      "valor": 150,
      "pago": 1,
      "data_vencimento": "2026-07-02",
      "data_recebimento": "2026-07-20",
      "qtd_aulas_feitas": 5,
      "valor_bruto": 150,
      "qtd_aguardando_reposicao": "1"
    }
  ],
  "first_page_url": "https://api.seufisio.com.br/api/servico-ciclo?page=1",
  "from": 1,
  "last_page": 1,
  "last_page_url": "https://api.seufisio.com.br/api/servico-ciclo?page=1",
  "links": [
    {
      "url": null,
      "label": "« Anterior",
      "page": null,
      "active": false
    },
    {
      "url": "https://api.seufisio.com.br/api/servico-ciclo?page=1",
      "label": "1",
      "page": 1,
      "active": true
    },
    {
      "url": null,
      "label": "Próximo »",
      "page": null,
      "active": false
    }
  ],
  "next_page_url": null,
  "path": "https://api.seufisio.com.br/api/servico-ciclo",
  "per_page": 20,
  "prev_page_url": null,
  "to": 3,
  "total": 3
}
```
