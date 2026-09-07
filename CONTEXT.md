# CONTEXT.md — Glossário do domínio

Termos fixados nas entrevistas KSS. Nomes de campo entre crases são do SeuFisio.

| Termo | Significado |
| --- | --- |
| **vencimento** (de um plano recorrente) | O dia do mês em que a cobrança mensal do plano é gerada: `dia_padrao_cobranca` do `cliente-servico`. Não confundir com `dia_padrao_renovacao` (renovação do ciclo) nem `data_encerramento` (fim do plano), que a skill não edita. Exposto na API como `dia_vencimento`. |
| **limite semanal** (de um serviço recorrente) | Quantidade máxima de atendimentos por semana do serviço. Extraída do `tipo_atendimento.nome` pelo padrão "Nx na Semana"; `null` quando o nome não segue o padrão (nesse caso não há validação). |
