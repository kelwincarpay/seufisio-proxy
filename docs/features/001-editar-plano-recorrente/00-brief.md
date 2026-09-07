# 001-editar-plano-recorrente · Brief

**Size:** M · **Track:** clarify → investigate → spec → plan → tickets → execute → review

## Symptom
A skill do SeuFisio no OpenClaw não consegue editar um plano recorrente (`cliente-servico`) já vendido a um cliente: o proxy não expõe os endpoints necessários, então o atendente precisa abrir o SeuFisio na mão para alterar vencimento, dias/horários, profissional ou qualquer outro campo do plano.

## Expected outcome
Via endpoints do proxy sob `/api`, o OpenClaw consegue ler e editar qualquer campo editável de um plano recorrente de um cliente (vencimento, dias e horários com profissional resolvido pela grade/turma, preço/desconto, sessões por semana, serviço), é orientado antes de exceder o limite de dias por semana, recebe erros do SeuFisio no mesmo formato dos endpoints existentes, e um MD em `docs/` descreve o fluxo para atualizar a skill.

## Actors and surfaces
- Atendente da MovArt — conversa com a skill SeuFisio no OpenClaw
- OpenClaw (skill SeuFisio) — chama o proxy em `/api/...` com o secret token
- Proxy (este repo) — traduz para a API upstream do SeuFisio, aplica regras (grade/turma, limite semanal, formato de erro)
- SeuFisio — sistema de origem; resolve sozinho os atendimentos futuros já gerados

## Out of scope
- Cancelar/encerrar o plano ou estornar cobranças (ações distintas de edição)
- Reagendar/editar atendimentos já realizados ou gerenciar individualmente os atendimentos futuros gerados pelo plano (o SeuFisio cuida disso)
- Edição de `pacote` (plano por quantidade de sessões) — só plano recorrente
- Alterar a própria skill no OpenClaw — este repo entrega apenas as APIs e o MD de orientação

## Layers touched
api  <!-- sem dado novo: tudo vive no SeuFisio; confirm in investigation se algum estado local (Supabase) precisa acompanhar a edição -->

## Open facts
- Quais requests upstream a captura `capturas/editar-plano-cliente.har` contém (converter com `npm run har -- capturas/editar-plano-cliente.har --out docs/editar-plano-cliente.md`): endpoint de leitura do plano, endpoint(s) de PUT/PATCH, payloads e ordem das chamadas.
- Quais campos do `cliente-servico` a tela permite editar e quais são obrigatórios no payload de edição (PUT de objeto completo, como em `charges`, ou PATCH parcial?).
- Como o proxy hoje resolve profissional por grade/turma para um dia/horário (qual serviço/rota implementa isso) e se é reutilizável sem alteração.
- Onde está o limite de dias por semana do plano e como o proxy o valida hoje na venda (`recurring-plans.ts`), para reaproveitar na edição.
- Qual é o formato de erro padrão que os endpoints existentes devolvem para o OpenClaw quando o SeuFisio recusa uma operação, e como a mensagem upstream é extraída.
- Como o SeuFisio devolve erro na edição do plano (HTTP status, corpo) e quais casos aparecem na captura ou são conhecidos (horário sem vaga, profissional indisponível, conflito).
- Se algum estado local (Supabase: onboarding, lembretes) referencia dias/horários do plano e precisa ser atualizado após a edição.
- Como os endpoints atuais em `routes/plans.ts` estão documentados para a skill, para o novo MD seguir o mesmo formato.

## Source
Precisamos implementar o fluxo de editação de pacotes na skill do seu fisio que usamos no openclaw, para isso precisamos primeiro criar/editar todas as APIs necessárias para funcionar, e para isso gravei todos os requests que fiz em um plano de um paciente @editar-plano-cliente.har, após ajustar e criar todas as APIs necessárias, crie um MD com o detalhamento para eu passar para o openclaw para atualizar a skill do seu fisio para adicionar essa nova habilidade de editar planos recorrentes. Nessa edição podemos editar data de vencimento, dias e horários de atendimentos, e é importante se atentar a quantidade de dias na semana para orientar o usuário da skill caso queira criar mais atendimentos do que permitido. Também é necessário escolher o profissional de atendimento para aquele dia e horário, mas devemos seguir a mesma lógica que já utilizamos para outros processos que precisam definir horários e atendimentos, encontrando o profissional de acordo com a grade e turma. Também existem alguns casos que a edição pode retornar algum erro que precisamos mostrar para o usuário no openclaw, então entender como esses erros são retornados baseados em outras APIs que já temos esse fluxo e estar preparado para isso.

Esclarecimentos da entrevista: nada da edição fica fora (todos os campos editáveis do plano); o SeuFisio resolve sozinho os atendimentos futuros já gerados; erros no mesmo formato dos endpoints existentes.
