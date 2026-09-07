# ADR-0001 · Contrato normalizado para leitura/edição do plano recorrente

- **Status:** accepted · 2026-09-07
- **Feature:** 001-editar-plano-recorrente (D-07)

## Contexto
A skill do OpenClaw já consome a resposta normalizada do `POST /api/plans` (201). O `cliente-servico`
bruto do SeuFisio usa datas `DD/MM/YYYY`, ids de sala e campos internos que a skill não deveria conhecer.

## Decisão
`GET` e `PUT /api/plans/recurring/:planId` respondem com o mesmo shape normalizado do 201 do POST,
acrescido dos campos da edição:

```
{
  id, cliente_id, servico: { id, nome },
  dias: [{ dia, hora, profissional: { id, nome }, sala, lotado }],
  valor_mensal, percentual_desconto, dia_vencimento,
  limite_semanal,          // número ou null (ver CONTEXT.md)
  horarios,                // texto de scheduleText()
  raw?                     // cliente-servico bruto, só com ?raw=1
}
```

## Consequências
- Um novo campo pedido pela skill exige mudança no proxy, mas `raw` cobre depuração sem deploy.
- O mapeamento bruto→normalizado fica em `services/recurring-plans.ts`, testado em `scripts/check-payloads.ts`.

## Rejeitadas
- Só normalizada sem `raw` (depuração dependeria de deploy).
- Objeto bruto (skill acoplada ao formato interno do SeuFisio).
