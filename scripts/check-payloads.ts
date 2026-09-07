/**
 * Verificação das funções puras contra os dados reais das capturas.
 *
 * O teste que importa: buildPlanPayload() gera exatamente o payload que o app do
 * SeuFisio enviou no HAR de 21/08/2026 (53 campos). Se algum default mudar, quebra aqui.
 *
 * Não bate na API. Precisa das env obrigatórias só porque config/env.ts valida no import:
 *
 *   SEUFISIO_USER=x SEUFISIO_PASSWORD=x SEUFISIO_CLIENT_SECRET=x API_SECRET_TOKEN=x \
 *     npx tsx scripts/check-payloads.ts
 *
 * O bloco de tipagem no final (contrato do plano recorrente) só é conferido pelo
 * compilador, que tsconfig.json não alcança (include: src/**\/*):
 *
 *   npx tsc --noEmit -p tsconfig.scripts.json
 */
import { buildPlanEditPayload, buildPlanPayload, countRequestedDays, endMonth, monthlyValue, normalizeRecurringPlan, parseWeeklyLimit, periodicidadeLabel, resolveEditPrice, resolvePrice, retroactiveSessions, scheduleText, toMonthYear, weekdayFields } from '../src/services/recurring-plans';
import type { NormalizedRecurringPlan, RecurringPlanEditInput } from '../src/services/recurring-plans';
import { discountNote, formatBRL } from '../src/services/charges';
import { missingRegistrationFields } from '../src/services/contracts';
import * as msg from '../src/services/onboarding-messages';
import { nextOccurrence } from '../src/services/slot-assignment';
import { validateEditInput, upstreamErrorStatus } from '../src/routes/plans';
import { readFileSync } from 'fs';
import { join } from 'path';

const tipo8 = { id: 8, nome: 'Pilates 1x na Semana', valor_mensal: 290, valor_trimestral: 600, valor_semestral: 1200 };
const tipo9 = { id: 9, nome: 'Pilates 2x na Semana', valor_mensal: 465, valor_trimestral: 1005, valor_semestral: 2010 };

console.log('--- valor mensal ---');
console.log('tipo8 semestral :', monthlyValue(tipo8, 6), '(esperado 200)');
console.log('tipo8 mensal    :', monthlyValue(tipo8, 1), '(esperado 290)');
console.log('tipo9 semestral :', monthlyValue(tipo9, 6), '(esperado 335)');
console.log('tipo8 anual     :', monthlyValue(tipo8, 12), '(esperado null, sem valor_anual)');
console.log('label 6         :', periodicidadeLabel(6));

console.log('\n--- data_encerramento ---');
console.log('2026-08-20 + 6 :', endMonth('2026-08-20', 6), '(esperado 02/2027)');
console.log('2026-08-20 + 1 :', endMonth('2026-08-20', 1), '(esperado 09/2026)');
console.log('2026-12-05 + 1 :', endMonth('2026-12-05', 1), '(esperado 01/2027)');
console.log('2026-12-05 + 6 :', endMonth('2026-12-05', 6), '(esperado 06/2027)');

const dias = [
  { dia: 'terca' as const, hora: '09:00', profissional_id: 1, sala_id: 1 },
  { dia: 'quinta' as const, hora: '09:00', profissional_id: 1, sala_id: 1 },
];
console.log('\n--- horarios ---');
console.log(scheduleText(dias));
console.log(scheduleText([dias[0], { ...dias[1], hora: '15:10' }]));

console.log('\n--- payload vs captura ---');
const payload = buildPlanPayload(
  { cliente_id: 216, tipo_atendimento_id: 8, periodicidade: 6, inicio_servico: '2026-08-20', dias },
  tipo8, 45390, resolvePrice(tipo8, 6),
);
const captured = {"domingo":false,"segunda":false,"terca":true,"quarta":false,"quinta":true,"sexta":false,"sabado":false,"sala_id_domingo":null,"sala_id_segunda":null,"sala_id_terca":1,"sala_id_quarta":null,"sala_id_quinta":1,"sala_id_sexta":null,"sala_id_sabado":null,"profissional_id_domingo":null,"profissional_id_segunda":null,"profissional_id_terca":1,"profissional_id_quarta":null,"profissional_id_quinta":1,"profissional_id_sexta":null,"profissional_id_sabado":null,"hora_domingo":"","hora_segunda":"","hora_terca":"09:00","hora_quarta":"","hora_quinta":"09:00","hora_sexta":"","hora_sabado":"","periodicidade":6,"created_by_user_id":45390,"possui_dias_fixos":1,"possui_data_encerramento":true,"percentual_desconto":0,"servico_gratis":false,"cobranca_automatica":false,"forma_pagamento":"","cartao_credito_id":null,"stripe_payment_method_id":null,"quantidade_reposicoes_por_ciclo":null,"ignorar_quantidade_reposicoes_por_ciclo":true,"permitir_justificar_ausencia_app_checkin":true,"permitir_reposicoes_apos_termino":false,"configurar_sem_dias_fixos":false,"nome_exibicao_tipo_atendimento":"Pilates 1x na Semana","congelar_valor":true,"gerar_todos_ciclos":false,"valor_congelado":200,"inicio_servico":"2026-08-20","data_encerramento":"02/2027","dia_padrao_renovacao":"20","dia_padrao_cobranca":"20","tipo_atendimento_id":8,"cliente_id":"216"} as Record<string, any>;

const keys = new Set([...Object.keys(captured), ...Object.keys(payload)]);
let diffs = 0;
for (const k of keys) {
  const a = JSON.stringify(captured[k]);
  const b = JSON.stringify((payload as any)[k]);
  if (a !== b) { console.log(`  DIFF ${k}: captura=${a} nosso=${b}`); diffs++; }
}
console.log(diffs === 0 ? '  ✔ payload idêntico à captura (' + keys.size + ' campos)' : `  ${diffs} diferença(s)`);

// Segunda captura (21/08/2026): plano MENSAL sem data de encerramento, terca 18:00 com
// Amanda (prof 3). Revela que mensal nao congela valor e que o encerramento vazio e "".
const diasMensal = [{ dia: 'terca' as const, hora: '18:00', profissional_id: 3, sala_id: 1 }];
const payloadMensal = buildPlanPayload(
  { cliente_id: 216, tipo_atendimento_id: 8, periodicidade: 1, inicio_servico: '2026-08-21', dias: diasMensal },
  tipo8, 21714, resolvePrice(tipo8, 1),
);
const capturedMensal = {"domingo":false,"segunda":false,"terca":true,"quarta":false,"quinta":false,"sexta":false,"sabado":false,"sala_id_domingo":null,"sala_id_segunda":null,"sala_id_terca":1,"sala_id_quarta":null,"sala_id_quinta":null,"sala_id_sexta":null,"sala_id_sabado":null,"profissional_id_domingo":null,"profissional_id_segunda":null,"profissional_id_terca":3,"profissional_id_quarta":null,"profissional_id_quinta":null,"profissional_id_sexta":null,"profissional_id_sabado":null,"hora_domingo":"","hora_segunda":"","hora_terca":"18:00","hora_quarta":"","hora_quinta":"","hora_sexta":"","hora_sabado":"","periodicidade":1,"created_by_user_id":21714,"possui_dias_fixos":1,"possui_data_encerramento":false,"percentual_desconto":0,"servico_gratis":false,"cobranca_automatica":false,"forma_pagamento":"","cartao_credito_id":null,"stripe_payment_method_id":null,"quantidade_reposicoes_por_ciclo":null,"ignorar_quantidade_reposicoes_por_ciclo":true,"permitir_justificar_ausencia_app_checkin":true,"permitir_reposicoes_apos_termino":false,"configurar_sem_dias_fixos":false,"nome_exibicao_tipo_atendimento":"Pilates 1x na Semana","congelar_valor":false,"gerar_todos_ciclos":false,"valor_congelado":"","inicio_servico":"2026-08-21","data_encerramento":"","dia_padrao_renovacao":"21","dia_padrao_cobranca":"21","tipo_atendimento_id":8,"cliente_id":"216"} as Record<string, any>;

console.log('\n--- payload MENSAL vs captura ---');
let diffsM = 0;
for (const k of new Set([...Object.keys(capturedMensal), ...Object.keys(payloadMensal)])) {
  const a = JSON.stringify(capturedMensal[k]);
  const b = JSON.stringify((payloadMensal as any)[k]);
  if (a !== b) { console.log(`  DIFF ${k}: captura=${a} nosso=${b}`); diffsM++; }
}
console.log(diffsM === 0 ? '  ✔ payload mensal idêntico à captura' : `  ${diffsM} diferença(s)`);

console.log('\n--- regra de congelamento ---');
console.log('mensal   :', JSON.stringify(resolvePrice(tipo8, 1)), '(nao congela, cobra 290 da tabela)');
console.log('semestral:', JSON.stringify(resolvePrice(tipo8, 6)), '(congela na parcela de 200)');
console.log('custom   :', JSON.stringify(resolvePrice(tipo8, 1, 250)), '(congela no valor pedido)');

console.log('\n--- desconto ---');
console.log(JSON.stringify(discountNote(200, 50, 150)));
console.log('esperado          :', JSON.stringify("Valor Original: R$ 200,00\\nAplic. Desc. de R$ 50,00(25,00%), R$ 150,00."));
console.log('milhar            :', formatBRL(1200));

console.log('\n--- campos faltando (cliente 216 real) ---');
const cliente216 = { nome: 'Kelwin Sanches Savoia', cpf: '431.474.308-55', data_nascimento: null, profissao: null, estado_civil: null, endereco: null, endereco_numero: null, cep: null, bairro: null, bairro_id: null, cidade: null, cidade_id: null, uf: null };
console.log(missingRegistrationFields(cliente216).join(', '));
console.log('completo:', missingRegistrationFields({ ...cliente216, data_nascimento: '1990-01-01', profissao: 'Dev', estado_civil: 'Casado', endereco: 'Rua X', endereco_numero: '10', cep: '12900-000', bairro_id: 3, cidade_id: 5, uf: 'SP' }).length === 0);

console.log('\n--- atendimentos retroativos ---');
// A captura real: plano criado em 21/08 com inicio em 20/08 (quinta) -> 1 sessao retroativa,
// e o listar-vendas devolveu atendimentosFeitos: 1.
const retro = retroactiveSessions('2026-08-20', dias, '2026-08-21');
console.log('inicio 20/08, hoje 21/08 :', JSON.stringify(retro), '(esperado 1: quinta 20/08)');
console.log('inicio 04/08, hoje 21/08 :', retroactiveSessions('2026-08-04', dias, '2026-08-21').map(r => r.dia_label + ' ' + r.data).join(', '));
console.log('inicio futuro            :', JSON.stringify(retroactiveSessions('2026-09-01', dias, '2026-08-21')), '(esperado [])');
console.log('inicio = hoje            :', JSON.stringify(retroactiveSessions('2026-08-21', dias, '2026-08-21')), '(esperado [])');

console.log('\n--- proxima ocorrencia do dia da semana ---');
// 2026-08-21 e uma sexta.
for (const [dia, esperado] of [['sexta','2026-08-21'],['sabado','2026-08-22'],['terca','2026-08-25'],['quinta','2026-08-27'],['quarta','2026-08-26']] as const) {
  const got = nextOccurrence(dia as any, '2026-08-21');
  console.log(`  ${dia.padEnd(8)} a partir de sexta 21/08 -> ${got} ${got === esperado ? 'OK' : 'ERRADO, esperado ' + esperado}`);
}

console.log('\n=== MENSAGENS ===');
const contracts = [
  { id: 100, nome_contrato: 'Contrato Cliente Pacote', link: 'https://api.seufisio.com/visualizar-contrato/AAA', aberto: false },
  { id: 101, nome_contrato: 'Termo de Consentimento', link: 'https://api.seufisio.com/visualizar-contrato/BBB', aberto: false },
];
console.log('\n[1]\n' + msg.registrationRequest({ nome: 'Kelwin Sanches Savoia', tipo_atendimento: 'Pilates 1x na Semana', dias_e_horarios: scheduleText(dias), link: 'https://api.seufisio.com/cadastro-completo/fb3bd489' }));
console.log('\n[2]\n' + msg.registrationReminder({ nome: 'Kelwin', link: 'https://api.seufisio.com/cadastro-completo/fb3bd489' }));
console.log('\n[3]\n' + msg.contractsReady({ nome: 'Kelwin', contracts }));
console.log('\n[4a os dois]\n' + msg.signatureReminder({ nome: 'Kelwin', contracts }));
console.log('\n[4a só o termo]\n' + msg.signatureReminder({ nome: 'Kelwin', contracts: [contracts[1]] }));
console.log('\n[4b abriu e parou]\n' + msg.signatureReminder({ nome: 'Kelwin', contracts: [{ ...contracts[1], aberto: true }] }));
console.log('\n[5]\n' + msg.onboardingComplete({ nome: 'Kelwin' }));

// --- contract: NormalizedRecurringPlan ---
// Auditoria de tipagem: o objeto abaixo é o plano recorrente 154 do HAR (quinta 10:00,
// vencimento dia 2, "Pilates 1x na Semana" -> limite_semanal 1) escrito à mão. Só compila
// quando os tipos do contrato existem em services/recurring-plans.
const expectedPlan: NormalizedRecurringPlan = {
  id: 154,
  cliente_id: 216,
  servico: { id: 8, nome: 'Pilates 1x na Semana' },
  dias: [{ dia: 'quinta', hora: '10:00', profissional: { id: null, nome: null }, sala: null, lotado: null }],
  valor_mensal: 290,
  percentual_desconto: 0,
  dia_vencimento: 2,
  limite_semanal: 1,
  horarios: 'quinta às 10h',
};
const emptyEdit: RecurringPlanEditInput = {};
console.log('\n--- contract types ---');
console.log(`plano ${expectedPlan.id}: ${expectedPlan.dias.length} dia(s), limite ${expectedPlan.limite_semanal}, vencimento ${expectedPlan.dia_vencimento}, edicao vazia ${JSON.stringify(emptyEdit)}`);
console.log('✔ contract types');

// --- 001 · service: edição de plano recorrente ---
// Fixtures do HAR reqs/editar-plano-cliente.har (plano 125 do cliente 322, "Pilates 1x na
// Semana" semestral, quinta 10:00 com o profissional 1). GET_HAR é o cliente-servico lido;
// PUT_HAR é o corpo que o app web enviou ao mudar SÓ o dia de vencimento para 15. Só os
// corpos entram aqui: o HAR carrega token vivo e é gitignored.
const GET_HAR = {"id":125,"cliente_id":322,"tipo_atendimento_id":8,"periodicidade":6,"dia_padrao_renovacao":2,"qtd_dias_efetuar_pagamento":null,"inicio_servico":"2026-07-02","domingo":false,"segunda":false,"terca":false,"quarta":false,"quinta":true,"sexta":false,"sabado":false,"hora_domingo":"","hora_segunda":"","hora_terca":"","hora_quarta":"","hora_quinta":"10:00","hora_sexta":"","hora_sabado":"","profissional_id_domingo":null,"profissional_id_segunda":null,"profissional_id_terca":null,"profissional_id_quarta":null,"profissional_id_quinta":1,"profissional_id_sexta":null,"profissional_id_sabado":null,"sala_id_domingo":null,"sala_id_segunda":null,"sala_id_terca":null,"sala_id_quarta":null,"sala_id_quinta":1,"sala_id_sexta":null,"sala_id_sabado":null,"created_at":"2026-07-02T18:41:06.000000Z","updated_at":"2026-08-12T08:16:28.000000Z","data_pause":null,"observacao":"<br />Gerado novo ciclo em 02/07/26 pelo usuário Pri Savoia<br />Gerado novo ciclo em 12/07/26 pelo sistema<br />Gerado novo ciclo em 12/08/26 pelo sistema","created_by_user_id":21714,"possui_dias_fixos":true,"percentual_desconto":"0.0000","data_encerramento":"2027-01-01","forma_pagamento":null,"cobranca_automatica":false,"servico_gratis":false,"cartao_credito_id":null,"stripe_payment_method_id":null,"quantidade_reposicoes_por_ciclo":0,"ignorar_quantidade_reposicoes_por_ciclo":true,"total_atendimentos_ciclo":null,"total_atendimentos_semanais_ciclo":null,"nome_exibicao_tipo_atendimento":"Pilates 1x na Semana","profissional_preferencia_id":null,"congelar_valor":true,"valor_congelado":200,"dia_padrao_cobranca":2,"permitir_justificar_ausencia_app_checkin":true,"emissao_nota_fiscal_automatica":false,"permitir_reposicoes_apos_termino":false,"nome":"Pilates 1x na Semana","count_faturas_vencidas":1,"is_encerrado":false} as Record<string, any>;
const PUT_HAR = {"id":125,"cliente_id":322,"tipo_atendimento_id":8,"periodicidade":6,"dia_padrao_renovacao":2,"qtd_dias_efetuar_pagamento":null,"inicio_servico":"2026-07-02","domingo":false,"segunda":false,"terca":false,"quarta":false,"quinta":true,"sexta":false,"sabado":false,"hora_domingo":"","hora_segunda":"","hora_terca":"","hora_quarta":"","hora_quinta":"10:00","hora_sexta":"","hora_sabado":"","profissional_id_domingo":null,"profissional_id_segunda":null,"profissional_id_terca":null,"profissional_id_quarta":null,"profissional_id_quinta":1,"profissional_id_sexta":null,"profissional_id_sabado":null,"sala_id_domingo":null,"sala_id_segunda":null,"sala_id_terca":null,"sala_id_quarta":null,"sala_id_quinta":1,"sala_id_sexta":null,"sala_id_sabado":null,"created_at":"2026-07-02T18:41:06.000000Z","updated_at":"2026-08-12T08:16:28.000000Z","data_pause":null,"observacao":"<br />Gerado novo ciclo em 02/07/26 pelo usuário Pri Savoia<br />Gerado novo ciclo em 12/07/26 pelo sistema<br />Gerado novo ciclo em 12/08/26 pelo sistema","created_by_user_id":21714,"possui_dias_fixos":true,"percentual_desconto":0,"data_encerramento":"01/2027","forma_pagamento":null,"cobranca_automatica":false,"servico_gratis":false,"cartao_credito_id":null,"stripe_payment_method_id":null,"quantidade_reposicoes_por_ciclo":0,"ignorar_quantidade_reposicoes_por_ciclo":true,"total_atendimentos_ciclo":null,"total_atendimentos_semanais_ciclo":null,"nome_exibicao_tipo_atendimento":"Pilates 1x na Semana","profissional_preferencia_id":null,"congelar_valor":true,"valor_congelado":200,"dia_padrao_cobranca":"15","permitir_justificar_ausencia_app_checkin":true,"emissao_nota_fiscal_automatica":false,"permitir_reposicoes_apos_termino":false,"nome":"Pilates 1x na Semana","count_faturas_vencidas":1,"is_encerrado":false,"possui_data_encerramento":true} as Record<string, any>;

let failures = 0;

/** Um valor esperado, comparado por JSON. */
function eq(nome: string, nosso: any, esperado: any): void {
  const a = JSON.stringify(esperado);
  const b = JSON.stringify(nosso);
  if (a === b) { console.log(`  ✔ ${nome}`); return; }
  console.log(`  DIFF ${nome}: esperado=${a} nosso=${b}`);
  failures++;
}

/** Diff chave a chave, como os blocos de criação acima. */
function eqKeys(nome: string, nosso: Record<string, any>, esperado: Record<string, any>): void {
  const keys = new Set([...Object.keys(esperado), ...Object.keys(nosso)]);
  let d = 0;
  for (const k of keys) {
    const a = JSON.stringify(esperado[k]);
    const b = JSON.stringify(nosso[k]);
    if (a !== b) { console.log(`  DIFF ${nome}.${k}: esperado=${a} nosso=${b}`); d++; }
  }
  if (d === 0) console.log(`  ✔ ${nome} (${keys.size} campos)`);
  failures += d;
}

console.log('\n--- edição: conversores de formato ---');
eq('toMonthYear 2027-01-01', toMonthYear('2027-01-01'), '01/2027');
eq('toMonthYear null', toMonthYear(null), '');

console.log('\n--- edição: limite semanal (FR-03/04) ---');
eq('Pilates 1x na Semana', parseWeeklyLimit('Pilates 1x na Semana'), 1);
eq('Pilates 3x na Semana', parseWeeklyLimit('Pilates 3x na Semana'), 3);
eq('PILATES 2X NA SEMANA', parseWeeklyLimit('PILATES 2X NA SEMANA'), 2);
eq('Aula Avulsa', parseWeeklyLimit('Aula Avulsa'), null);
eq('Fisioterapia Sessão', parseWeeklyLimit('Fisioterapia Sessão'), null);
eq('nome vazio', parseWeeklyLimit(''), null);

console.log('\n--- edição: contagem de dias pedidos (FR-09) ---');
eq('terça e quinta', countRequestedDays([{ dia: 'terca', hora: '09:00' }, { dia: 'quinta', hora: '10:00' }]), 2);
eq('terça duas vezes conta 1', countRequestedDays([{ dia: 'terca', hora: '09:00' }, { dia: 'terca', hora: '18:00' }]), 1);
eq('sem dias', countRequestedDays([]), 0);

console.log('\n--- edição: regra de preço (FR-17/18/19) ---');
eq('valor_mensal informado', resolveEditPrice(GET_HAR, null, 250), { valor_congelado: 250, congelar_valor: true });
eq('valor_mensal informado, serviço trocado', resolveEditPrice(GET_HAR, tipo9, 250), { valor_congelado: 250, congelar_valor: true });
const precoNovo = resolvePrice(tipo9, GET_HAR.periodicidade);
eq('serviço trocado sem valor (semestral 2010/6)', resolveEditPrice(GET_HAR, tipo9), {
  valor_congelado: precoNovo.valor_congelado, congelar_valor: precoNovo.congelar,
});
eq('serviço trocado sem valor, plano mensal não congela', resolveEditPrice({ ...GET_HAR, periodicidade: 1 }, tipo9), { valor_congelado: null, congelar_valor: false });
eq('nada mudou ecoa o lido', resolveEditPrice(GET_HAR, null), { valor_congelado: 200, congelar_valor: true });

console.log('\n--- edição: payload do PUT vs captura (FR-07/08) ---');
const editVenc = buildPlanEditPayload(GET_HAR, { dia_vencimento: 15 }, null, resolveEditPrice(GET_HAR, null), null);
eqKeys('edit payload · vencimento 15', editVenc, PUT_HAR);

// Corpo vazio: só os três deltas de formato (desconto numérico, MM/YYYY, flag derivada).
const deltasDeFormato = { percentual_desconto: 0, data_encerramento: '01/2027', possui_data_encerramento: true };
eqKeys('edit payload · corpo vazio', buildPlanEditPayload(GET_HAR, {}, null, resolveEditPrice(GET_HAR, null), null), { ...GET_HAR, ...deltasDeFormato });

// Proibido sincronizar a renovação com o vencimento, ou mexer no ciclo.
eq('renovação preservada', editVenc.dia_padrao_renovacao, GET_HAR.dia_padrao_renovacao);
eq('encerramento preservado (mês)', editVenc.data_encerramento, '01/2027');
eq('inicio_servico preservado', editVenc.inicio_servico, GET_HAR.inicio_servico);
eq('periodicidade preservada', editVenc.periodicidade, GET_HAR.periodicidade);

console.log('\n--- edição: grade semanal (FR-14) ---');
const diasEdit = [
  { dia: 'terca' as const, hora: '09:00', profissional_id: 1, sala_id: 1 },
  { dia: 'quinta' as const, hora: '19:00', profissional_id: 3, sala_id: 1 },
];
const campos = weekdayFields(diasEdit);
eq('weekdayFields · 7 dias × 4 campos', Object.keys(campos).length, 28);
const editDias = buildPlanEditPayload(GET_HAR, { dias: diasEdit }, diasEdit, resolveEditPrice(GET_HAR, null), null);
eqKeys('edit payload · dias', editDias, { ...GET_HAR, ...deltasDeFormato, ...campos });
eq('dia em uso · terça', [editDias.terca, editDias.hora_terca, editDias.profissional_id_terca, editDias.sala_id_terca], [true, '09:00', 1, 1]);
eq('dia sem uso · domingo', [editDias.domingo, editDias.hora_domingo, editDias.profissional_id_domingo, editDias.sala_id_domingo], [false, '', null, null]);

console.log('\n--- edição: desconto e serviço trocado (FR-18/20) ---');
eq('percentual_desconto gravado numérico', buildPlanEditPayload(GET_HAR, { percentual_desconto: 10 }, null, resolveEditPrice(GET_HAR, null), null).percentual_desconto, 10);
const editServico = buildPlanEditPayload(GET_HAR, { tipo_atendimento_id: 9 }, null, resolveEditPrice(GET_HAR, tipo9), tipo9);
eq('serviço trocado', [editServico.tipo_atendimento_id, editServico.nome_exibicao_tipo_atendimento, editServico.valor_congelado, editServico.congelar_valor], [9, 'Pilates 2x na Semana', 335, true]);

console.log('\n--- edição: normalização (FR-01/02/03/04/16/20) ---');
const tipoLido = { id: 8, nome: 'Pilates 1x na Semana' };
const normal = normalizeRecurringPlan(GET_HAR, tipoLido, {});
eqKeys('normalize · plano 125', normal as any, {
  id: 125,
  cliente_id: 322,
  servico: { id: 8, nome: 'Pilates 1x na Semana' },
  dias: [{ dia: 'quinta', hora: '10:00', profissional: { id: 1, nome: null }, sala: 1, lotado: null }],
  valor_mensal: 200,
  percentual_desconto: 0,
  dia_vencimento: 2,
  limite_semanal: 1,
  horarios: scheduleText([{ dia: 'quinta', hora: '10:00', profissional_id: 1, sala_id: 1 }]),
});
eq('normalize · sem raw por padrão', 'raw' in normal, false);
eq('normalize · sem aviso com limite conhecido', 'aviso' in normal, false);
eq('normalize · includeRaw', normalizeRecurringPlan(GET_HAR, tipoLido, { includeRaw: true }).raw?.id, 125);
eq('normalize · percentual_desconto', normalizeRecurringPlan({ ...GET_HAR, percentual_desconto: '10.0000' }, tipoLido, {}).percentual_desconto, 10);

const semLimite = normalizeRecurringPlan(GET_HAR, { id: 12, nome: 'Aula Avulsa' }, {});
eq('normalize · limite indeterminado', semLimite.limite_semanal, null);
eq('normalize · aviso presente', Boolean(semLimite.aviso), true);
console.log('  aviso:', semLimite.aviso);

// Nome do profissional: a leitura resolve pela lista de profissionais, a edição pelo que a
// atribuição de vagas escolheu (que também traz a lotação).
eq('normalize · nome via profissionais', normalizeRecurringPlan(GET_HAR, tipoLido, { profissionais: [{ id: 1, nome: 'Pri Savoia' }] }).dias[0].profissional, { id: 1, nome: 'Pri Savoia' });
const atribuido = normalizeRecurringPlan(GET_HAR, tipoLido, {
  assigned: [{ dia: 'quinta', hora: '10:00', profissional_id: 1, profissional_nome: 'Amanda', sala_id: 1, data_referencia: '2026-09-10', vagas: 0, lotado: true, atribuido_automaticamente: false }],
});
eq('normalize · nome e lotação via assigned', atribuido.dias[0], { dia: 'quinta', hora: '10:00', profissional: { id: 1, nome: 'Amanda' }, sala: 1, lotado: true });

// Finding 2 (ticket 05): o PUT sem `dias` não tem `assigned`, então o único jeito de
// `profissional.nome` sair preenchido no re-GET é o handler também buscar e passar
// `profissionais` — igual o GET faz. Checagem estática porque o handler não é exportado.
const routeSource = readFileSync(join(__dirname, '../src/routes/plans.ts'), 'utf8');
const reGetCall = routeSource.match(/normalizeRecurringPlan\(raw2,\s*tipo,\s*\{([^}]*)\}\)/);
eq(
  'PUT recurring/:planId · re-GET passa profissionais para normalizeRecurringPlan',
  Boolean(reGetCall && /profissionais/.test(reGetCall[1])),
  true,
);

// --- 001 · api: validateEditInput / upstreamErrorStatus ---
console.log('\n--- validateEditInput ---');
let editChecks = 0;
let editFailures = 0;
function checkEdit(label: string, body: any, expectOk: boolean) {
  editChecks++;
  const result = validateEditInput(body);
  const got = result.ok;
  if (got !== expectOk) {
    editFailures++;
    console.log(`  FAIL ${label}: esperado ok:${expectOk}, obtido ok:${got}${!got ? ' (' + (result as any).error + ')' : ''}`);
  } else {
    console.log(`  ok   ${label}: ok:${got}${!got ? ' (' + (result as any).error + ')' : ''}`);
  }
  return result;
}

checkEdit('corpo vazio', {}, false);

checkEdit('dia_vencimento 0', { dia_vencimento: 0 }, false);
checkEdit('dia_vencimento 32', { dia_vencimento: 32 }, false);
checkEdit('dia_vencimento "15"', { dia_vencimento: '15' }, false);
checkEdit('dia_vencimento 15', { dia_vencimento: 15 }, true);

checkEdit('hora "9:00"', { dias: [{ dia: 'quinta', hora: '9:00' }] }, false);
checkEdit('dia "quinta-feira"', { dias: [{ dia: 'quinta-feira', hora: '09:00' }] }, false);
checkEdit('dia/hora válidos', { dias: [{ dia: 'quinta', hora: '09:00' }] }, true);

checkEdit('tipo_atendimento_id "8"', { tipo_atendimento_id: '8' }, false);
checkEdit('percentual_desconto 101', { percentual_desconto: 101 }, false);
checkEdit('valor_mensal -1', { valor_mensal: -1 }, false);
checkEdit('valor_mensal 300', { valor_mensal: 300 }, true);

const ignoredResult = checkEdit('campos desconhecidos ignorados', { dia_vencimento: 10, estranho: 'x' }, true);
if (ignoredResult.ok && 'estranho' in (ignoredResult.input as any)) {
  editFailures++;
  console.log('  FAIL campos desconhecidos: "estranho" vazou para dentro de input');
}

checkEdit('só chaves desconhecidas', { diaVencimento: 10 }, false);

const salaResult = checkEdit(
  'sala_id não é aceito',
  { dias: [{ dia: 'quinta', hora: '09:00', sala_id: 'abc' }] },
  true,
);
if (salaResult.ok && 'sala_id' in ((salaResult.input.dias as any[])[0] as any)) {
  editFailures++;
  console.log('  FAIL sala_id não é aceito: "sala_id" vazou para dentro de input.dias[0]');
}

console.log(editFailures === 0 ? `  ✔ validateEditInput (${editChecks} casos)` : `  ${editFailures} falha(s) em validateEditInput`);

console.log('\n--- upstreamErrorStatus ---');
let statusFailures = 0;
function checkStatus(label: string, error: any, expected: number) {
  const got = upstreamErrorStatus(error);
  if (got !== expected) {
    statusFailures++;
    console.log(`  FAIL ${label}: esperado ${expected}, obtido ${got}`);
  } else {
    console.log(`  ok   ${label}: ${got}`);
  }
}
checkStatus('response.status 404', { response: { status: 404 } }, 404);
checkStatus('response.status 422', { response: { status: 422 } }, 422);
checkStatus('response.status 500', { response: { status: 500 } }, 500);
checkStatus('erro de rede sem response', { message: 'connect ECONNREFUSED' }, 500);
console.log(statusFailures === 0 ? '  ✔ upstreamErrorStatus' : `  ${statusFailures} falha(s) em upstreamErrorStatus`);

if (failures + diffs + diffsM + editFailures + statusFailures > 0) {
  console.log(`\n${failures + diffs + diffsM + editFailures + statusFailures} diferença(s) — verificação falhou`);
  process.exitCode = 1;
}
