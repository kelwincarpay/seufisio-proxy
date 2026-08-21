# Mensagens de WhatsApp do onboarding

Rascunho para validação. Calibradas pela mensagem de lembrete de aula que já roda em
`src/services/reminder-cron.ts`: abertura `Oi, {nome}!`, uma frase dizendo o motivo,
💚 no fim dela, instrução em negrito com emoji, e o slogan em itálico fechando.

Formatação WhatsApp: `*negrito*`, `_itálico_`. `{...}` são as variáveis.

---

## 1. Envio do link de cadastro

Disparada pelo `POST /api/plans`, logo depois de criar o plano.

```
Oi, {primeiro_nome}!

Seu plano no MovArt Pilates já está criado: {tipo_atendimento}, {dias_e_horarios}. 💚

Para emitir seu contrato falta completar seu cadastro. É onde entram endereço, data de nascimento, profissão e estado civil.

📝 *{link_cadastro}*

_Você é a arte que se move_
```

Exemplo renderizado:

> Oi, Kelwin!
>
> Seu plano no MovArt Pilates já está criado: Pilates 1x na Semana, terça e quinta às 9h. 💚
>
> Para emitir seu contrato falta completar seu cadastro. É onde entram endereço, data de nascimento, profissão e estado civil.
>
> 📝 *https://api.seufisio.com/cadastro-completo/fb3bd489-…*
>
> _Você é a arte que se move_

---

## 2. Reenvio do cadastro (48h sem preencher)

```
Oi, {primeiro_nome}!

Passando aqui para lembrar do seu cadastro no MovArt Pilates. Ele ainda está incompleto, e é o que falta para emitir seu contrato. 💚

📝 *{link_cadastro}*

_Você é a arte que se move_
```

O `Passando aqui para` é o mesmo do lembrete de aula, de propósito.

---

## 3. Envio dos contratos

Disparada quando o cron vê o cadastro completo e gera os dois contratos.

```
Oi, {primeiro_nome}!

Seu cadastro está completo. 💚 Agora são dois documentos para assinar, a assinatura é feita na própria tela:

📄 *Contrato do plano*
{link_contrato}

📄 *Termo de consentimento*
{link_termo}

_Você é a arte que se move_
```

---

## 4. Cobrança da assinatura (48h)

Duas versões, escolhidas pelo `data_hora_abertura` de cada contrato. Lista **só o que
falta** (decidido): se o cliente assinou um dos dois, a mensagem cobra apenas o outro.

### 4a. Nem abriu

```
Oi, {primeiro_nome}!

Ficou faltando assinar {documentos_pendentes}. É o último passo para fechar seu plano no MovArt Pilates. 💚

📄 *{nome_documento}*
{link}

_Você é a arte que se move_
```

`{documentos_pendentes}`: `seu contrato e o termo de consentimento` / `seu contrato` /
`o termo de consentimento`.

### 4b. Abriu e não assinou

```
Oi, {primeiro_nome}!

Vi que você abriu {documentos_pendentes} mas não chegou a finalizar a assinatura. Se ficou alguma dúvida, pode me chamar por aqui. 💚

📄 *{nome_documento}*
{link}

_Você é a arte que se move_
```

---

## 5. Confirmação final (opcional)

Quando os dois estão assinados.

```
Oi, {primeiro_nome}!

Contrato e termo assinados, seu plano está ativo. 💚

_Você é a arte que se move_
```

Sem a linha de check-in: cliente de plano fixo não faz check-in pelo app.

Considerei fechar com "sua próxima sessão é {quando}", mas a criação do plano gera
atendimentos retroativos, então "primeira sessão" pode cair no passado. Se quiser essa
linha, ela sai do próximo atendimento futuro, não do início do plano.

---

## Variáveis

| Variável | Origem |
| --- | --- |
| `{primeiro_nome}` | `cliente.nome.split(' ')[0]` (mesmo tratamento do lembrete) |
| `{tipo_atendimento}` | `nome_exibicao_tipo_atendimento` do plano |
| `{dias_e_horarios}` | grade do plano, formatada tipo `terça e quinta às 9h` |
| `{link_cadastro}` | `GET /api/cliente/:id/link-cadastro-cliente` |
| `{link_contrato}` / `{link_termo}` | `GET /api/contrato/:id/link` |
| `{nome_documento}` | `nome_contrato` do contrato |
| `{documentos_pendentes}` | montado a partir de quais contratos estão sem `data_hora_assinatura` |

Todas as mensagens ficam em um módulo único (`src/services/onboarding-messages.ts`), como
o `buildMessage` do `reminder-cron`, para você editar texto sem mexer na lógica do cron.

## Decisões de escrita

O que evitei de propósito: "estamos à disposição", "prezado", "solicitamos que",
"conforme combinado", gerúndio de atendimento ("estaremos enviando"). Horário no formato
`9h` / `15h10`, igual ao lembrete, não `09:00`.

A 4b fala na primeira pessoa ("pode me chamar por aqui"), aprovado assim. É a única
mensagem que usa "eu"; o lembrete de aula não usa em nenhum ponto.

Textos aprovados em 21/08/2026. Editar em `src/services/onboarding-messages.ts`.
