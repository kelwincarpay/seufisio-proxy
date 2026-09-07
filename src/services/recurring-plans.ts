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
// Type-only: slot-assignment imports DAY_NAMES from here, so a value import would
// close the cycle. The day shapes live there because the assignment rule owns them.
import type { AssignedDay, DayRequest } from './slot-assignment';

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

/** One weekly slot as the normalized plan reports it (ADR-0001). */
export interface NormalizedPlanDay {
  dia: DayName;
  hora: string;
  profissional: { id: number | null; nome: string | null };
  sala: number | null;
  /**
   * The slot exists but has no room left. null on a plain read, where the calendar is
   * not consulted; a boolean after an edit, which does consult it.
   */
  lotado: boolean | null;
}

/**
 * The plan as the proxy reports it: mirrors the 201 of POST /api/plans plus the fields
 * only the edit flow needs (`percentual_desconto`, `dia_vencimento`, `limite_semanal`,
 * `horarios`).
 */
export interface NormalizedRecurringPlan {
  id: number;
  cliente_id: number;
  servico: { id: number; nome: string };
  dias: NormalizedPlanDay[];
  valor_mensal: number | null;
  percentual_desconto: number;
  dia_vencimento: number;
  /** Weekly class count read off the service name; null when it cannot be parsed. */
  limite_semanal: number | null;
  /** Present only when `limite_semanal` is null, saying the limit was not checked. */
  aviso?: string;
  horarios: string;
  /** The raw upstream `cliente-servico`. Present only with `?raw=1`. */
  raw?: Record<string, any>;
}

/**
 * What a caller may change on a recurring plan. Every field is optional and only the
 * ones present are applied over the object read upstream; an empty body is a 400,
 * which the route rejects before reaching the service.
 */
export interface RecurringPlanEditInput {
  /** Day of month the charge falls on, 1-31. */
  dia_vencimento?: number;
  /** Replaces the whole weekly schedule when present. */
  dias?: DayRequest[];
  tipo_atendimento_id?: number;
  valor_mensal?: number;
  /** 0-100. */
  percentual_desconto?: number;
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

  Object.assign(payload, weekdayFields(input.dias));

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

// ---------------------------------------------------------------------------
// Editing a recurring plan (PUT /api/cliente-servico/:id).
//
// The upstream wants the whole object echoed back with only the changed fields
// touched — same shape as the discount PUT in services/charges.ts. Captured in
// docs/editar-plano-recorrente.md (HAR of 12/08/2026, plan 125).
// ---------------------------------------------------------------------------

/** "Pilates 2x na Semana", "PILATES 2X NA SEMANA" — the count is the only stable part. */
const WEEKLY_LIMIT_RE = /(\d+)x\s*na\s*semana/i;

/** Said in the response when the service name carries no weekly count. */
const AVISO_SEM_LIMITE =
  'Limite semanal não pôde ser determinado pelo nome do serviço, então a quantidade de dias não foi conferida.';

/** Weekly class count in a service name ("Pilates 2x na Semana" -> 2), or null. */
export function parseWeeklyLimit(nome: string): number | null {
  const match = WEEKLY_LIMIT_RE.exec(nome || '');
  return match ? Number(match[1]) : null;
}

/** The seven-weekday block of a `cliente-servico` (`terca`, `hora_terca`, ...). */
export function weekdayFields(dias: PlanDay[]): Record<string, any> {
  const fields: Record<string, any> = {};
  // Unused days go false / null / "" (empty string on the hour, not null).
  for (const day of DAY_NAMES) {
    const match = dias.find((d) => d.dia === day);
    fields[day] = Boolean(match);
    fields[`sala_id_${day}`] = match ? match.sala_id : null;
    fields[`profissional_id_${day}`] = match ? match.profissional_id : null;
    fields[`hora_${day}`] = match ? match.hora : '';
  }
  return fields;
}

/** ISO date -> the `MM/YYYY` the upstream uses for `data_encerramento`. */
export function toMonthYear(iso: string | null): string {
  if (!iso) return '';
  const [year, month] = String(iso).split('-');
  if (!year || !month) return '';
  return `${month.padStart(2, '0')}/${year}`;
}

/**
 * Price to send on an edit. Note the keys are the upstream's (`congelar_valor`), unlike
 * `ResolvedPrice.congelar` used when creating a plan.
 *
 * A price given by hand always wins and always freezes. Otherwise a new service means the
 * creation rule runs again for the plan's own length, and an untouched service keeps the
 * amount the plan was sold at — a read-only edit must not silently reprice it.
 */
export function resolveEditPrice(
  raw: any,
  tipoNovo: any | null,
  valorMensal?: number,
): { valor_congelado: number | null; congelar_valor: boolean } {
  if (valorMensal != null) {
    return { valor_congelado: Number(valorMensal), congelar_valor: true };
  }
  if (tipoNovo) {
    const price = resolvePrice(tipoNovo, Number(raw?.periodicidade));
    // resolvePrice reports "not freezing" as "" (what the create sends); the edit contract
    // carries null for the same thing.
    return {
      valor_congelado: price.valor_congelado === '' ? null : Number(price.valor_congelado),
      congelar_valor: price.congelar,
    };
  }
  return {
    valor_congelado: numberOrNull(raw?.valor_congelado),
    congelar_valor: Boolean(raw?.congelar_valor),
  };
}

function numberOrNull(value: any): number | null {
  return value == null || value === '' ? null : Number(value);
}

/**
 * The full `cliente-servico` object to PUT: the one read upstream with `input` applied.
 *
 * Everything not named in `input` is echoed exactly as read, including the fields the
 * caller may not edit — `dia_padrao_renovacao`, `inicio_servico` and `periodicidade` stay
 * put, so moving the due day does not move the renewal or the cycle. Two fields come back
 * from the GET in a read format and have to be rewritten: the end date (ISO -> MM/YYYY)
 * and the discount (string "0.0000" -> number).
 */
export function buildPlanEditPayload(
  raw: any,
  input: RecurringPlanEditInput,
  dias: PlanDay[] | null,
  price: { valor_congelado: number | null; congelar_valor: boolean },
  tipoNovo: any | null,
): Record<string, any> {
  const payload: Record<string, any> = { ...raw };

  const encerramento = raw?.data_encerramento;
  payload.data_encerramento = toMonthYear(encerramento ?? null);
  // Not in the GET at all; the app derives it from the end date on the way out.
  payload.possui_data_encerramento = Boolean(encerramento);
  payload.percentual_desconto = Number(raw?.percentual_desconto) || 0;

  if (input.percentual_desconto != null) {
    payload.percentual_desconto = Number(input.percentual_desconto);
  }
  // The due day, as a day of the month in a string — the renewal day is left alone.
  if (input.dia_vencimento != null) {
    payload.dia_padrao_cobranca = String(input.dia_vencimento);
  }
  if (dias) {
    Object.assign(payload, weekdayFields(dias));
  }
  if (input.tipo_atendimento_id != null) {
    payload.tipo_atendimento_id = input.tipo_atendimento_id;
    if (tipoNovo?.nome) payload.nome_exibicao_tipo_atendimento = tipoNovo.nome;
  }
  payload.valor_congelado = price.valor_congelado;
  payload.congelar_valor = price.congelar_valor;

  return payload;
}

/**
 * Upstream `cliente-servico` -> the shape the skill reads.
 *
 * The professional's name is not in the object, only the id: a plain read resolves it
 * against the professionals list, while an edit takes it from the slot assignment, which
 * also knows whether the slot is full. Neither is available on a bare call, and then the
 * name is null rather than guessed.
 */
export function normalizeRecurringPlan(
  raw: any,
  tipo: any,
  opts: { assigned?: AssignedDay[]; profissionais?: any[]; includeRaw?: boolean },
): NormalizedRecurringPlan {
  const nome = tipo?.nome ?? raw?.nome_exibicao_tipo_atendimento ?? '';

  const dias: NormalizedPlanDay[] = [];
  for (const day of DAY_NAMES) {
    if (raw?.[day] !== true) continue;
    const atribuido = opts.assigned?.find((a) => a.dia === day);
    const profissionalId = raw[`profissional_id_${day}`] ?? null;
    const daLista = opts.profissionais?.find(
      (p: any) => profissionalId != null && Number(p?.id) === Number(profissionalId),
    );
    dias.push({
      dia: day,
      hora: raw[`hora_${day}`] || '',
      profissional: { id: profissionalId, nome: daLista?.nome ?? atribuido?.profissional_nome ?? null },
      sala: raw[`sala_id_${day}`] ?? null,
      lotado: atribuido ? atribuido.lotado : null,
    });
  }

  const limite = parseWeeklyLimit(nome);
  const plan: NormalizedRecurringPlan = {
    id: Number(raw?.id),
    cliente_id: Number(raw?.cliente_id),
    servico: { id: Number(raw?.tipo_atendimento_id), nome },
    dias,
    valor_mensal: numberOrNull(raw?.valor_congelado),
    percentual_desconto: Number(raw?.percentual_desconto) || 0,
    dia_vencimento: Number(raw?.dia_padrao_cobranca),
    limite_semanal: limite,
    // Same sentence the create flow puts in the WhatsApp copy; the proxy sends nothing.
    horarios: scheduleText(
      dias.map((d) => ({
        dia: d.dia,
        hora: d.hora,
        profissional_id: d.profissional.id ?? 0,
        sala_id: d.sala ?? 0,
      })),
    ),
  };
  if (limite === null) plan.aviso = AVISO_SEM_LIMITE;
  if (opts.includeRaw) plan.raw = raw;
  return plan;
}

/** PUT of the full object to /api/cliente-servico/:id. */
export async function updateRecurringPlan(
  planId: number | string,
  payload: Record<string, any>,
): Promise<{ success: boolean }> {
  return seufisioClient.put(`/api/cliente-servico/${planId}`, payload);
}

/**
 * How many weekly classes a requested schedule asks for, to check against the limit.
 * Two slots on the same weekday are still one class per week in the studio's counting.
 */
export function countRequestedDays(dias: DayRequest[]): number {
  return new Set(dias.map((d) => d.dia)).size;
}
