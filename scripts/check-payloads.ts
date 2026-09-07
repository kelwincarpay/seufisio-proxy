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
import { buildPlanPayload, endMonth, monthlyValue, periodicidadeLabel, resolvePrice, retroactiveSessions, scheduleText } from '../src/services/recurring-plans';
import type { NormalizedRecurringPlan, RecurringPlanEditInput } from '../src/services/recurring-plans';
import { discountNote, formatBRL } from '../src/services/charges';
import { missingRegistrationFields } from '../src/services/contracts';
import * as msg from '../src/services/onboarding-messages';
import { nextOccurrence } from '../src/services/slot-assignment';

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
