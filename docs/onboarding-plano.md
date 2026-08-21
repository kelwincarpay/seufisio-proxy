# Onboarding pós-venda — desenho acordado

Depois que o plano é criado, o cliente precisa: (1) completar o cadastro, (2) assinar dois
contratos. Isso não pode depender de alguém lembrar de cobrar. Este documento é o desenho
de referência da automação.

## Princípio: um cron, uma tabela de estado

O agente **não cria crons**. Um cron por cliente acumularia N jobs sem estado durável, e
o proxy reinicia a cada deploy no Railway — job em memória criado pelo agente morre e não
volta.

Em vez disso: **um sweep único no proxy varrendo uma tabela de estado no Supabase**, mesmo
padrão que já roda em `src/services/reminder-cron.ts` para os lembretes de aula.

E o agente não precisa nem ser instruído: **`POST /api/plans` registra o onboarding
sozinho** ao criar o plano. Não há passo que o agente possa esquecer.

## Máquina de estados

```
POST /api/plans
  ├─ cria cliente-servico
  ├─ (se houver valor pago antes) aplica desconto na 1ª cobrança
  ├─ insere client_onboarding { estado: cadastro_pendente }
  └─ manda o link de cadastro no WhatsApp

cron */10min:
  cadastro_pendente
    ├─ GET /api/cliente/:id → campos do contrato completos?
    │    sim → gera os 2 contratos → manda os 2 links → estado: contrato_pendente
    └─ não, e link_enviado_em > 48h → reenvia o link, atualiza link_enviado_em

  contrato_pendente
    ├─ GET /api/relatorio/contrato?filtro_cliente_id=:id → os 2 assinados?
    │    sim → manda a confirmação → estado: concluido
    └─ não, e contratos_enviados_em > 48h → cobra só os pendentes, atualiza o timer
```

Toda transição é idempotente e reprocessável: o estado vive no banco, não na memória.
Restart do processo não perde nada.

## Cadastro do cliente

Link: `GET /api/cliente/:id/link-cadastro-cliente` → string, ex.
`https://api.seufisio.com/cadastro-completo/fb3bd489-d5ca-4224-9866-019a2e48588f`.

Se o cliente não tem telefone, o agente pede e atualiza antes de disparar — `PUT
/api/customers/:id` já existe e faz merge com o objeto atual.

Campos que precisam estar preenchidos para o contrato sair correto (checados em
`GET /api/cliente/:id`):

| Campo | Observação |
| --- | --- |
| `nome` | já vem do cadastro inicial |
| `cpf` | já vem do cadastro inicial |
| `data_nascimento` | usado no Termo de Consentimento |
| `profissao` | usado no Termo de Consentimento |
| `estado_civil` | **só o Termo usa** — não esquecer |
| `endereco` | rua |
| `endereco_numero` | |
| `cep` | |
| `bairro` (ou `bairro_id`) | |
| `cidade` (ou `cidade_id`) | |
| `uf` | |

`endereco_complemento` é opcional (nem todo endereço tem). A lista bate com as variáveis
que o modelo aceita (`GET /api/modelo-contrato/get-propriedades/:id`) e foi confirmada na
prática: o Termo gerado com cadastro incompleto saiu com nove campos em branco, incluindo
estado civil e profissão.

## Contratos

Fluxo completo em `contratos.md`. Dois contratos por plano: modelo 1 (Contrato Cliente
Pacote) e modelo 2 (Termo de Consentimento).

Só podem ser gerados **depois** que o cadastro está completo: o `texto` é um snapshot
renderizado no momento da criação, então um contrato gerado antes fica com endereço e
profissão em branco para sempre.

Assinatura: **`data_hora_assinatura != null`**, confirmado com assinatura real.
**Não usar `aceitou`** — vem `1` tanto no assinado quanto no pendente.

O poll é por contrato, então a cobrança de 48h menciona só o que ainda falta assinar. Se
`data_hora_abertura` está preenchido e `data_hora_assinatura` não, o cliente abriu e parou
no meio — a mensagem muda (ver `mensagens-onboarding.md`).

## Tabela `client_onboarding`

| Coluna | Tipo | Uso |
| --- | --- | --- |
| `id` | bigint pk | |
| `seufisio_cliente_id` | int, unique parcial por plano | |
| `plano_id` | int | id do `cliente-servico` |
| `estado` | text | `cadastro_pendente` / `contrato_pendente` / `concluido` |
| `telefone` | text | normalizado no envio |
| `link_cadastro` | text | |
| `link_cadastro_enviado_em` | timestamptz | base do timer de 48h |
| `tentativas_cadastro` | int | quantos reenvios já saíram |
| `cadastro_completo_em` | timestamptz | |
| `contrato_cliente_id` | int | contrato do modelo 1 |
| `contrato_termo_id` | int | contrato do modelo 2 |
| `contratos_enviados_em` | timestamptz | base do timer de 48h |
| `tentativas_contrato` | int | |
| `contratos_assinados_em` | timestamptz | |
| `ultimo_erro` | text | |
| `created_at` / `updated_at` | timestamptz | |

Envios registrados em `onboarding_log` (tabela própria — `notification_log` é específica
dos lembretes de aula, com `atendimento_id` e `class_start`).

## Endpoints do proxy

| Endpoint | Uso |
| --- | --- |
| `POST /api/plans` | valida → cria plano → (desconto) → registra onboarding → manda o link |
| `GET /api/plans/recurring/:id` | ler plano recorrente (hoje as rotas só leem `pacote`) |
| `GET /api/onboarding/:clienteId` | estado atual, para o agente responder "o X já assinou?" |
| `POST /api/onboarding/:clienteId/resend` | forçar reenvio manual |
| `POST /api/onboarding/run-sweep` | rodar o sweep na mão, com `dry_run` (igual `notifications/run-sweep`) |

## Env novas

| Var | Default |
| --- | --- |
| `ONBOARDING_CRON` | `*/10 * * * *` |
| `ONBOARDING_RESEND_HOURS` | `48` |
| `MODELO_CONTRATO_CLIENTE_ID` | `1` |
| `MODELO_CONTRATO_TERMO_ID` | `2` |

Sem Supabase ou sem Evolution configurados, o cron loga e se desabilita — mesmo
comportamento do `reminder-cron`.

## Fora de escopo (V2)

- Cobrança automática no cartão (`cobranca_automatica`, Stripe/Juno).
- Validação de superlotação na criação do plano.
- Planos sem dias fixos.
