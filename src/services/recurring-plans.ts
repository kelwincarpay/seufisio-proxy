/**
 * Recurring plans (`cliente-servico`, "serviço recorrente").
 *
 * Not to be confused with `pacote` / "pacote personalizado", which the older routes
 * in routes/plans.ts talk to via /api/pacote. A client can hold both at once.
 *
 * Spec: docs/criar-plano-recorrente.md
 */
import { seufisioClient } from './seufisio-client';
import { addDays, formatHour } from './client-attendances';

export const DAY_NAMES = [
  'domingo',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado',
] as const;

export type DayName = (typeof DAY_NAMES)[number];

/** Lowercase labels, for the middle of a sentence ("terça e quinta às 9h"). */
const DAY_LABEL: Record<DayName, string> = {
  domingo: 'domingo',
  segunda: 'segunda',
  terca: 'terça',
  quarta: 'quarta',
  quinta: 'quinta',
  sexta: 'sexta',
  sabado: 'sábado',
};

/**
 * `periodicidade` is the plan length in MONTHS, matching the `periodo` column of
 * GET /api/tipos-aluno (there is no `value: 6` in that enum, which is what pins it
 * down). Each length reads its price from a different column of tipo_atendimento.
 */
const VALOR_FIELD: Record<number, string> = {
  1: 'valor_mensal',
  2: 'valor_bimestral',
  3: 'valor_trimestral',
  4: 'valor_quadrimestral',
  6: 'valor_semestral',
  8: 'valor_octomestral',
  12: 'valor_anual',
};

const PERIODICIDADE_LABEL: Record<number, string> = {
  1: 'Mensal',
  2: 'Bimestral',
  3: 'Trimestral',
  4: 'Quadrimestral',
  6: 'Semestral',
  8: 'Octomestral',
  12: 'Anual',
};

export interface PlanDay {
  dia: DayName;
  hora: string;
  profissional_id: number;
  sala_id: number;
}

export interface CreatePlanInput {
  cliente_id: number | string;
  tipo_atendimento_id: number;
  /** Plan length in months: 1 (Mensal) or 6 (Semestral) at MovArt. */
  periodicidade: number;
  inicio_servico: string;
  dias: PlanDay[];
  possui_data_encerramento?: boolean;
  /** Only when a custom price was requested; otherwise derived from the price table. */
  valor_congelado?: number;
  nome_exibicao_tipo_atendimento?: string;
}

export function periodicidadeLabel(periodicidade: number): string {
  return PERIODICIDADE_LABEL[periodicidade] || `${periodicidade} meses`;
}

export function isValidPeriodicidade(periodicidade: number): boolean {
  return Object.prototype.hasOwnProperty.call(VALOR_FIELD, periodicidade);
}

/**
 * Monthly instalment for a plan: the price table column for that length divided by
 * the number of months. Tipo 8 semestral = 1200 / 6 = 200, and the generated contract
 * reads "Valor: R$ 200,00 por mês" — the semester is 6 × 200, not 1200 up front.
 */
export function monthlyValue(tipoAtendimento: any, periodicidade: number): number | null {
  const field = VALOR_FIELD[periodicidade];
  if (!field) return null;
  const total = tipoAtendimento?.[field];
  if (total == null || total === '') return null;
  const value = Number(total) / periodicidade;
  return Math.round(value * 100) / 100;
}

export interface ResolvedPrice {
  /** What goes in `congelar_valor`. */
  congelar: boolean;
  /** What goes in `valor_congelado`: the amount, or "" when not freezing. */
  valor_congelado: number | '';
  /** The monthly amount the client will actually be charged, for reporting. */
  valor_mensal: number | null;
}

/**
 * Freezing rule, taken from the two captured flows.
 *
 * Mensal: the app sends `congelar_valor: false` and `valor_congelado: ""`, so the plan
 * follows `valor_mensal` in the price table and moves with it if the studio raises prices.
 *
 * Semestral: the app freezes at the monthly instalment (`valor_semestral / 6`), because the
 * table only holds the cycle total — charging 200/month requires pinning 200.
 *
 * A custom price always freezes, whatever the period.
 */
export function resolvePrice(
  tipoAtendimento: any,
  periodicidade: number,
  custom?: number | null,
): ResolvedPrice {
  if (custom != null && custom !== ('' as any)) {
    const value = Number(custom);
    return { congelar: true, valor_congelado: value, valor_mensal: value };
  }

  const derived = monthlyValue(tipoAtendimento, periodicidade);
  if (periodicidade === 1) {
    return { congelar: false, valor_congelado: '', valor_mensal: derived };
  }
  return { congelar: derived != null, valor_congelado: derived ?? '', valor_mensal: derived };
}

/** "2026-08-20" + 6 → "02/2027" (the API derives the exact day from the renewal day). */
export function endMonth(inicioServico: string, periodicidade: number): string {
  const [y, m] = inicioServico.split('-').map(Number);
  const zero = y * 12 + (m - 1) + periodicidade;
  const year = Math.floor(zero / 12);
  const month = (zero % 12) + 1;
  return `${String(month).padStart(2, '0')}/${year}`;
}

/** "terça e quinta às 9h" / "terça às 9h e sexta às 15h10" — for the WhatsApp copy. */
export function scheduleText(dias: PlanDay[]): string {
  if (!dias.length) return 'sem dias fixos';
  const hours = new Set(dias.map((d) => d.hora));
  const join = (parts: string[]) =>
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}` : parts[0];

  if (hours.size === 1) {
    return `${join(dias.map((d) => DAY_LABEL[d.dia]))} às ${formatHour(dias[0].hora)}`;
  }
  return join(dias.map((d) => `${DAY_LABEL[d.dia]} às ${formatHour(d.hora)}`));
}

export interface RetroactiveSession {
  data: string;
  dia: DayName;
  dia_label: string;
  hora: string;
}

/**
 * Sessions the plan grid lands on between `inicio_servico` and today, inclusive.
 *
 * Creating a plan with a start date in the past makes SeuFisio generate those
 * attendances retroactively, which surprises whoever sold the plan. Computed from the
 * grid rather than read back, so holidays (which have no session per the contract) may
 * make this an upper bound.
 */
export function retroactiveSessions(
  inicioServico: string,
  dias: PlanDay[],
  today: string,
): RetroactiveSession[] {
  if (inicioServico >= today) return [];

  const byWeekday = new Map<number, PlanDay>();
  for (const d of dias) byWeekday.set(DAY_NAMES.indexOf(d.dia), d);

  const out: RetroactiveSession[] = [];
  // Guard the walk: a start date far in the past should not spin forever.
  for (let date = inicioServico, i = 0; date <= today && i < 400; date = addDays(date, 1), i++) {
    // Midday UTC keeps the weekday stable regardless of offset.
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const match = byWeekday.get(weekday);
    if (match) {
      out.push({
        data: date,
        dia: match.dia,
        dia_label: DAY_LABEL[match.dia],
        hora: match.hora,
      });
    }
  }
  return out;
}

/** The 50+ field payload SeuFisio expects, shared by validar-criacao and the create. */
export function buildPlanPayload(
  input: CreatePlanInput,
  tipoAtendimento: any,
  createdByUserId: number,
  price: ResolvedPrice,
): Record<string, any> {
  const payload: Record<string, any> = {};

  // Weekly grid: unused days go false / null / "" (empty string on the hour, not null).
  for (const day of DAY_NAMES) {
    const match = input.dias.find((d) => d.dia === day);
    payload[day] = Boolean(match);
    payload[`sala_id_${day}`] = match ? match.sala_id : null;
    payload[`profissional_id_${day}`] = match ? match.profissional_id : null;
    payload[`hora_${day}`] = match ? match.hora : '';
  }

  const dia = String(Number(input.inicio_servico.split('-')[2]));
  // All monthly plans run open-ended at MovArt; only multi-month plans get an end date.
  const comEncerramento = input.possui_data_encerramento ?? input.periodicidade > 1;

  payload.periodicidade = input.periodicidade;
  payload.created_by_user_id = createdByUserId;
  payload.possui_dias_fixos = 1;
  payload.possui_data_encerramento = comEncerramento;
  payload.percentual_desconto = 0;
  payload.servico_gratis = false;
  // Card charging is V2: always off.
  payload.cobranca_automatica = false;
  payload.forma_pagamento = '';
  payload.cartao_credito_id = null;
  payload.stripe_payment_method_id = null;
  payload.quantidade_reposicoes_por_ciclo = null;
  payload.ignorar_quantidade_reposicoes_por_ciclo = true;
  payload.permitir_justificar_ausencia_app_checkin = true;
  payload.permitir_reposicoes_apos_termino = false;
  payload.configurar_sem_dias_fixos = false;
  payload.nome_exibicao_tipo_atendimento =
    input.nome_exibicao_tipo_atendimento || tipoAtendimento?.nome || '';
  payload.congelar_valor = price.congelar;
  payload.gerar_todos_ciclos = false;
  payload.valor_congelado = price.valor_congelado;
  payload.inicio_servico = input.inicio_servico;
  // Empty string, not null, when there is no end date — that is what the app sends.
  payload.data_encerramento = comEncerramento
    ? endMonth(input.inicio_servico, input.periodicidade)
    : '';
  payload.dia_padrao_renovacao = dia;
  payload.dia_padrao_cobranca = dia;
  payload.tipo_atendimento_id = input.tipo_atendimento_id;
  payload.cliente_id = String(input.cliente_id);

  return payload;
}

export interface PlanValidation {
  codigo?: string;
  pode_prosseguir?: boolean;
  conflito?: any;
}

export async function validatePlan(payload: Record<string, any>): Promise<PlanValidation> {
  return seufisioClient.post('/api/cliente-servico/validar-criacao', payload);
}

export async function createPlan(payload: Record<string, any>): Promise<any> {
  return seufisioClient.post('/api/cliente-servico', payload);
}

export async function getRecurringPlan(planId: number | string): Promise<any> {
  return seufisioClient.get(`/api/cliente-servico/${planId}`);
}

/** The user id that goes in `created_by_user_id`. */
export async function getCurrentUserId(): Promise<number> {
  const user = await seufisioClient.get('/api/user/user');
  return user?.id;
}

export async function getTipoAtendimento(id: number): Promise<any> {
  const list: any[] = await seufisioClient.get('/api/tipo-atendimento', { rowsPerPage: 'all' });
  return (list || []).find((t) => Number(t.id) === Number(id));
}

/**
 * The plan's row in the client's active sales list. Holds the cycle id (absent from
 * the create response) and the session counters.
 */
export async function getPlanSalesRow(
  clienteId: number | string,
  planId: number,
): Promise<any | null> {
  const sales = await seufisioClient.get(`/api/cliente/${clienteId}/listar-vendas`, {
    tab: 'ativas',
    page: 1,
    per_page: 20,
  });
  return (sales?.data || []).find((s: any) => Number(s.id) === Number(planId)) || null;
}

/** The cycle id of a plan, needed to find the charge it generated. */
export async function getPlanCycleId(
  clienteId: number | string,
  planId: number,
): Promise<number | null> {
  const row = await getPlanSalesRow(clienteId, planId);
  return row?.cicloId ?? null;
}

/**
 * The unpaid charge SeuFisio generated for the plan's first cycle. Matches on
 * `servico_ciclo_id`, falling back to the title ("Ref. serviço 154 ciclo: 20/08/2026").
 */
export async function findCycleCharge(
  clienteId: number | string,
  planId: number,
): Promise<any | null> {
  const [cycleId, list] = await Promise.all([
    getPlanCycleId(clienteId, planId),
    seufisioClient.get('/api/conta-receber', {
      page: 1,
      rowsPerPage: 50,
      'filterWhere[cliente_id]': clienteId,
      'filterWhere[pago]': 0,
    }),
  ]);

  const rows: any[] = list?.data || [];
  if (cycleId != null) {
    const byCycle = rows.find((r) => Number(r.servico_ciclo_id) === Number(cycleId));
    if (byCycle) return byCycle;
  }
  return rows.find((r) => String(r.titulo || '').includes(`serviço ${planId} `)) || null;
}

export { DAY_LABEL };
