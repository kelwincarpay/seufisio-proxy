import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';
import { isSupabaseConfigured } from '../services/supabase';
import { applyDiscount } from '../services/charges';
import { registerOnboarding } from '../services/onboarding';
import { studioToday } from '../services/client-attendances';
import { assignProfessionals, AssignedDay, DayRequest } from '../services/slot-assignment';
import {
  CreatePlanInput,
  DAY_NAMES as RECURRING_DAYS,
  PlanDay,
  RecurringPlanEditInput,
  buildPlanEditPayload,
  buildPlanPayload,
  countRequestedDays,
  createPlan,
  findCycleCharge,
  getCurrentUserId,
  getPlanSalesRow,
  getRecurringPlan,
  getTipoAtendimento,
  isValidPeriodicidade,
  normalizeRecurringPlan,
  parseWeeklyLimit,
  periodicidadeLabel,
  resolveEditPrice,
  resolvePrice,
  retroactiveSessions,
  scheduleText,
  updateRecurringPlan,
  validatePlan,
} from '../services/recurring-plans';

const router = Router();

const DAY_NAMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as const;
const DAY_LABELS: Record<string, string> = {
  domingo: 'Domingo',
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
};

/**
 * Manual validation of a `PUT /recurring/:planId` body. Only the fields present are
 * checked. Unknown keys are silently ignored — they never reach `input`; a body that
 * yields no recognized field at all (empty, or only unknown/misspelled keys) is
 * rejected so the edit always changes something instead of writing back a no-op.
 */
export function validateEditInput(
  body: any,
): { ok: true; input: RecurringPlanEditInput } | { ok: false; error: string } {
  const emptyBody = {
    ok: false as const,
    error:
      'Corpo vazio: informe ao menos um campo para editar (dia_vencimento, dias, tipo_atendimento_id, valor_mensal, percentual_desconto)',
  };
  if (!body || typeof body !== 'object') return emptyBody;

  const input: RecurringPlanEditInput = {};

  if (Object.prototype.hasOwnProperty.call(body, 'dia_vencimento')) {
    const v = body.dia_vencimento;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 31) {
      return {
        ok: false,
        error: `Invalid dia_vencimento "${v}". Use an integer between 1 and 31.`,
      };
    }
    input.dia_vencimento = v;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'dias')) {
    const dias = body.dias;
    if (!Array.isArray(dias) || dias.length === 0) {
      return {
        ok: false,
        error: 'dias must be a non-empty array of { dia, hora, profissional_id? }',
      };
    }
    const parsed: DayRequest[] = [];
    for (const d of dias) {
      if (!RECURRING_DAYS.includes(d?.dia)) {
        return {
          ok: false,
          error: `Invalid dia "${d?.dia}". Use one of: ${RECURRING_DAYS.join(', ')}`,
        };
      }
      if (!/^\d{2}:\d{2}$/.test(String(d?.hora || ''))) {
        return { ok: false, error: `Invalid hora "${d?.hora}" for ${d?.dia}. Use HH:MM.` };
      }
      let profissionalId: number | null | undefined;
      if (Object.prototype.hasOwnProperty.call(d, 'profissional_id')) {
        if (d.profissional_id !== null && typeof d.profissional_id !== 'number') {
          return {
            ok: false,
            error: `Invalid profissional_id "${d.profissional_id}" for ${d.dia}. Use a number or null.`,
          };
        }
        profissionalId = d.profissional_id;
      }
      // sala_id is not part of the edit contract: assignProfessionals picks the room.
      parsed.push({ dia: d.dia, hora: d.hora, profissional_id: profissionalId });
    }
    input.dias = parsed;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'tipo_atendimento_id')) {
    const v = body.tipo_atendimento_id;
    if (typeof v !== 'number') {
      return { ok: false, error: `Invalid tipo_atendimento_id "${v}". Use a number.` };
    }
    input.tipo_atendimento_id = v;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'valor_mensal')) {
    const v = body.valor_mensal;
    if (typeof v !== 'number' || v < 0) {
      return { ok: false, error: `Invalid valor_mensal "${v}". Use a number >= 0.` };
    }
    input.valor_mensal = v;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'percentual_desconto')) {
    const v = body.percentual_desconto;
    if (typeof v !== 'number' || v < 0 || v > 100) {
      return { ok: false, error: `Invalid percentual_desconto "${v}". Use a number between 0 and 100.` };
    }
    input.percentual_desconto = v;
  }

  if (Object.keys(input).length === 0) return emptyBody;

  return { ok: true, input };
}

/** Any 4xx from an axios error keeps its status; everything else (5xx, network) is 500. */
export function upstreamErrorStatus(error: any): number {
  const status = error?.response?.status;
  if (typeof status === 'number' && status >= 400 && status <= 499) return status;
  return 500;
}

/**
 * POST /api/plans
 * Create a recurring plan (cliente-servico) for a client.
 *
 * Body: {
 *   cliente_id, tipo_atendimento_id,
 *   periodicidade,               // plan length in MONTHS: 1 = Mensal, 6 = Semestral
 *   inicio_servico,              // YYYY-MM-DD
 *   dias: [{ dia, hora, profissional_id, sala_id }],
 *   possui_data_encerramento?,   // default true
 *   valor_congelado?,            // only for a custom price; otherwise from the table
 *   desconto?: { valor, descricao? },  // credit already paid, applied to the 1st charge
 *   confirmar?,                  // required to proceed when the validation warns
 *   onboarding?                  // default true — registers the follow-up flow
 * }
 *
 * Validates upstream first. If SeuFisio reports a conflict the request stops with
 * 409 and the message, so the agent can confirm with the user before creating
 * (superlotação is deliberately not checked here).
 *
 * Spec: docs/criar-plano-recorrente.md
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const {
      cliente_id,
      tipo_atendimento_id,
      periodicidade,
      inicio_servico,
      dias,
      possui_data_encerramento,
      valor_congelado,
      nome_exibicao_tipo_atendimento,
      desconto,
      confirmar,
      onboarding,
    } = body;

    if (!cliente_id || !tipo_atendimento_id || !periodicidade || !inicio_servico) {
      res.status(400).json({
        error:
          'Missing required fields: cliente_id, tipo_atendimento_id, periodicidade, inicio_servico',
      });
      return;
    }
    if (!Array.isArray(dias) || dias.length === 0) {
      res.status(400).json({
        error: 'dias must be a non-empty array of { dia, hora, profissional_id, sala_id }',
      });
      return;
    }
    if (!isValidPeriodicidade(Number(periodicidade))) {
      res.status(400).json({
        error: `Invalid periodicidade "${periodicidade}". Use the plan length in months: 1, 2, 3, 4, 6, 8 or 12.`,
      });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(inicio_servico))) {
      res.status(400).json({ error: 'inicio_servico must be YYYY-MM-DD' });
      return;
    }
    for (const d of dias) {
      if (!RECURRING_DAYS.includes(d?.dia)) {
        res.status(400).json({
          error: `Invalid dia "${d?.dia}". Use one of: ${RECURRING_DAYS.join(', ')}`,
        });
        return;
      }
      if (!/^\d{2}:\d{2}$/.test(String(d?.hora || ''))) {
        res.status(400).json({ error: `Invalid hora "${d?.hora}" for ${d?.dia}. Use HH:MM.` });
        return;
      }
    }

    const input: CreatePlanInput = {
      cliente_id,
      tipo_atendimento_id: Number(tipo_atendimento_id),
      periodicidade: Number(periodicidade),
      inicio_servico,
      dias,
      possui_data_encerramento,
      valor_congelado,
      nome_exibicao_tipo_atendimento,
    };

    const [tipo, createdByUserId] = await Promise.all([
      getTipoAtendimento(input.tipo_atendimento_id),
      getCurrentUserId(),
    ]);

    if (!tipo) {
      res.status(400).json({ error: `tipo_atendimento_id ${input.tipo_atendimento_id} not found` });
      return;
    }

    // Resolve the professional (and room) for each day from the calendar, the same way
    // the create-attendance flow does. A day that already names a professional keeps it.
    const assignment = await assignProfessionals(dias, inicio_servico);
    if (assignment.problemas.length > 0) {
      res.status(400).json({
        error: 'Não foi possível definir profissional para todos os dias pedidos',
        problemas: assignment.problemas,
      });
      return;
    }

    input.dias = assignment.dias;

    // Mensal follows the price table; semestral freezes at the monthly instalment.
    const price = resolvePrice(tipo, input.periodicidade, valor_congelado);
    if (price.valor_mensal == null || !isFinite(price.valor_mensal)) {
      res.status(400).json({
        error: `"${tipo.nome}" has no price for ${periodicidadeLabel(input.periodicidade)}. Send valor_congelado to set it manually.`,
      });
      return;
    }
    const valor = price.valor_mensal;

    const payload = buildPlanPayload(input, tipo, createdByUserId, price);

    const validation = await validatePlan(payload);
    const blocked = validation?.pode_prosseguir === false || Boolean(validation?.conflito);
    if (blocked && !confirmar) {
      res.status(409).json({
        needs_confirmation: true,
        message:
          'SeuFisio returned a warning for this schedule. Confirm with the user, then repeat the request with confirmar: true.',
        validation,
        resumo: {
          tipo_atendimento: tipo.nome,
          periodicidade: periodicidadeLabel(input.periodicidade),
          horarios: scheduleText(input.dias),
          valor_mensal: valor,
          dias: assignment.dias,
        },
      });
      return;
    }

    console.log(
      `[Plans] Creating recurring plan for client ${cliente_id}: tipo ${input.tipo_atendimento_id}, ` +
        `${periodicidadeLabel(input.periodicidade)}, ${scheduleText(input.dias)}, valor ${valor}`,
    );

    const plan = await createPlan(payload);

    // Credit already paid (avaliação, sessão avulsa) → discount on the generated charge.
    let descontoAplicado: any = null;
    if (desconto?.valor) {
      try {
        const charge = await findCycleCharge(cliente_id, plan.id);
        if (!charge) {
          descontoAplicado = { aplicado: false, error: 'Cobrança do ciclo não encontrada' };
        } else {
          const result = await applyDiscount(charge.id, Number(desconto.valor), {
            descricao: desconto.descricao,
          });
          descontoAplicado = {
            aplicado: true,
            conta_receber_id: charge.id,
            valor_original: result.valor_original,
            valor_desconto: result.valor_desconto,
            valor_final: result.valor_final,
          };
        }
      } catch (e: any) {
        console.error('[Plans] Discount failed:', e?.response?.data || e.message);
        descontoAplicado = { aplicado: false, error: e?.response?.data || e.message };
      }
    }

    // A start date in the past makes SeuFisio generate those sessions retroactively.
    // Report them so the agent can warn instead of leaving it to be discovered later.
    let atendimentosRetroativos: any = null;
    const hoje = studioToday();
    if (input.inicio_servico < hoje) {
      const sessoes = retroactiveSessions(input.inicio_servico, input.dias, hoje);
      let contabilizados: number | null = null;
      try {
        const row = await getPlanSalesRow(cliente_id, plan.id);
        contabilizados = row?.atendimentosFeitos ?? null;
      } catch (e: any) {
        console.error('[Plans] Could not read session counters:', e?.message);
      }
      atendimentosRetroativos = {
        inicio_no_passado: true,
        inicio_servico: input.inicio_servico,
        hoje,
        quantidade_prevista: sessoes.length,
        atendimentos_contabilizados: contabilizados,
        sessoes,
        aviso:
          sessoes.length > 0
            ? `O plano começou em ${input.inicio_servico}, antes de hoje, então o SeuFisio gerou ${sessoes.length} atendimento(s) retroativo(s). Avise o usuário e confirme se é isso que ele queria.`
            : `O plano começou em ${input.inicio_servico}, antes de hoje, mas nenhum dia da grade caiu nesse intervalo.`,
      };
      console.log(`[Plans] Retroactive sessions for plan ${plan.id}:`, JSON.stringify(atendimentosRetroativos));
    }

    // Register the follow-up flow and send the registration link. Done here so the
    // agent cannot forget it.
    let onboardingResult: any = null;
    if (onboarding !== false) {
      if (!isSupabaseConfigured()) {
        onboardingResult = { registrado: false, error: 'Supabase não configurado' };
      } else {
        try {
          onboardingResult = await registerOnboarding({
            cliente_id: Number(cliente_id),
            plano_id: Number(plan.id),
            tipo_atendimento: payload.nome_exibicao_tipo_atendimento,
            dias_e_horarios: scheduleText(input.dias),
          });
        } catch (e: any) {
          console.error('[Plans] Onboarding registration failed:', e?.message);
          onboardingResult = { registrado: false, error: e?.message };
        }
      }
    }

    res.status(201).json({
      success: true,
      plan: {
        id: plan.id,
        cliente_id: plan.cliente_id,
        tipo_atendimento: payload.nome_exibicao_tipo_atendimento,
        tipo_atendimento_id: plan.tipo_atendimento_id,
        periodicidade: plan.periodicidade,
        periodicidade_label: periodicidadeLabel(Number(plan.periodicidade)),
        inicio_servico: plan.inicio_servico,
        data_encerramento: plan.data_encerramento,
        dia_padrao_cobranca: plan.dia_padrao_cobranca,
        valor_mensal: valor,
        // false = follows the studio price table, so it moves if prices change.
        valor_travado: price.congelar,
        horarios: scheduleText(input.dias),
      },
      validation,
      dias: assignment.dias,
      atendimentos_retroativos: atendimentosRetroativos,
      desconto: descontoAplicado,
      onboarding: onboardingResult,
    });
  } catch (error: any) {
    console.error('[Plans] Error creating recurring plan:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create recurring plan',
      details: error?.response?.data || error.message,
    });
  }
});

/**
 * GET /api/plans/recurring/:planId[?raw=1]
 * Read a recurring plan (cliente-servico) by its own id — no cliente_id needed. The
 * older GET /:planId only reads `pacote` (pacote personalizado), which is a different
 * entity. `?raw=1` adds the raw upstream object to the response.
 */
router.get('/recurring/:planId', async (req: Request, res: Response) => {
  const { planId } = req.params;
  const includeRaw = req.query.raw === '1';

  try {
    const raw = await getRecurringPlan(String(planId));
    const [tipo, profissionais] = await Promise.all([
      getTipoAtendimento(Number(raw.tipo_atendimento_id)),
      seufisioClient.get('/api/profissional/todos-profissionais'),
    ]);

    const plan = normalizeRecurringPlan(raw, tipo, { profissionais, includeRaw });
    res.json(plan);
  } catch (error: any) {
    console.error('[Plans] Error reading recurring plan:', error?.response?.data || error.message);
    res.status(upstreamErrorStatus(error)).json({
      error: 'Failed to read recurring plan',
      details: error?.response?.data || error.message,
    });
  }
});

/**
 * PUT /api/plans/recurring/:planId[?raw=1]
 * Edit a recurring plan: GET the current `cliente-servico`, apply only the fields the
 * caller sent, PUT the full object back, then re-GET for the response. Days/hours, if
 * sent, replace the whole weekly schedule and are checked against the weekly limit of
 * the (possibly new) service before anything is written.
 */
router.put('/recurring/:planId', async (req: Request, res: Response) => {
  const { planId } = req.params;
  const includeRaw = req.query.raw === '1';

  const validation = validateEditInput(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const input = validation.input;

  try {
    const raw = await getRecurringPlan(String(planId));

    const tipoAtendimentoIdTrocou =
      input.tipo_atendimento_id != null &&
      Number(input.tipo_atendimento_id) !== Number(raw.tipo_atendimento_id);
    const tipo = await getTipoAtendimento(
      input.tipo_atendimento_id ?? raw.tipo_atendimento_id,
    );
    if (!tipo) {
      res.status(400).json({
        error: `tipo_atendimento_id ${input.tipo_atendimento_id ?? raw.tipo_atendimento_id} not found`,
      });
      return;
    }
    const tipoNovo = tipoAtendimentoIdTrocou ? tipo : null;

    const limite = parseWeeklyLimit(tipo.nome);
    if (input.dias && limite !== null) {
      const pedidos = countRequestedDays(input.dias);
      if (pedidos > limite) {
        res.status(400).json({
          error: `"${tipo.nome}" permite no máximo ${limite} dia(s) por semana; foram pedidos ${pedidos}.`,
          limite_semanal: limite,
          dias_pedidos: pedidos,
          servico: tipo.nome,
        });
        return;
      }
    }

    let planDays: PlanDay[] | null = null;
    let assigned: AssignedDay[] | undefined;
    if (input.dias) {
      const assignment = await assignProfessionals(input.dias, studioToday());
      if (assignment.problemas.length > 0) {
        res.status(400).json({
          error: 'Não foi possível definir profissional para todos os dias pedidos',
          problemas: assignment.problemas,
        });
        return;
      }
      assigned = assignment.dias;
      planDays = assignment.dias.map((d) => ({
        dia: d.dia,
        hora: d.hora,
        profissional_id: d.profissional_id,
        sala_id: d.sala_id,
      }));
    }

    const price = resolveEditPrice(raw, tipoNovo, input.valor_mensal);
    const payload = buildPlanEditPayload(raw, input, planDays, price, tipoNovo);

    await updateRecurringPlan(String(planId), payload);

    const [raw2, profissionais] = await Promise.all([
      getRecurringPlan(String(planId)),
      seufisioClient.get('/api/profissional/todos-profissionais'),
    ]);
    const plan = normalizeRecurringPlan(raw2, tipo, { assigned, profissionais, includeRaw });
    res.json(plan);
  } catch (error: any) {
    console.error('[Plans] Error editing recurring plan:', error?.response?.data || error.message);
    res.status(upstreamErrorStatus(error)).json({
      error: 'Failed to edit recurring plan',
      details: error?.response?.data || error.message,
    });
  }
});

/**
 * GET /api/plans/:planId
 * Get plan details including current schedule from inf_renovacao.
 * Resolves professional names from their IDs.
 */
router.get('/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;

    console.log(`[Plans] Fetching details for plan ${planId}`);

    // Fetch plan details and professionals in parallel
    const [plan, professionals]: [any, any[]] = await Promise.all([
      seufisioClient.get(`/api/pacote/${planId}`),
      seufisioClient.get('/api/profissional/todos-profissionais'),
    ]);

    // Build a map of professional id → name
    const profMap = new Map<number, string>();
    for (const prof of professionals || []) {
      profMap.set(prof.id, prof.nome);
    }

    // Parse inf_renovacao to extract the current schedule
    const infRenovacao = plan.inf_renovacao || {};
    const currentSchedule: Array<{
      day: string;
      dayLabel: string;
      hora: string;
      profissional_id: number;
      profissional_nome: string;
      sala_id: number;
    }> = [];

    for (const day of DAY_NAMES) {
      const dayData = infRenovacao[day];
      if (dayData && typeof dayData === 'object') {
        currentSchedule.push({
          day,
          dayLabel: DAY_LABELS[day],
          hora: dayData.hora,
          profissional_id: dayData.profissional_id,
          profissional_nome: profMap.get(dayData.profissional_id) || `Profissional ${dayData.profissional_id}`,
          sala_id: dayData.sala_id,
        });
      }
    }

    res.json({
      id: plan.id,
      cliente_id: plan.cliente_id,
      cliente_nome: plan.cliente_nome,
      data_inicial: plan.data_inicial,
      qtd_atendimentos_contratados: plan.qtd_atendimentos_contratados,
      qtd_aulas_feitas: plan.qtd_aulas_feitas,
      tipo_atendimento_id: infRenovacao.tipo_atendimento_id || null,
      currentSchedule,
    });
  } catch (error: any) {
    console.error('[Plans] Error fetching details:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch plan details',
      details: error?.response?.data || error.message,
    });
  }
});

interface UpdateScheduleBody {
  data_inicio_alteracao: string;
  domingo?: boolean;
  segunda?: boolean;
  terca?: boolean;
  quarta?: boolean;
  quinta?: boolean;
  sexta?: boolean;
  sabado?: boolean;
  sala_id_domingo?: number | null;
  sala_id_segunda?: number | null;
  sala_id_terca?: number | null;
  sala_id_quarta?: number | null;
  sala_id_quinta?: number | null;
  sala_id_sexta?: number | null;
  sala_id_sabado?: number | null;
  profissional_id_domingo?: number | null;
  profissional_id_segunda?: number | null;
  profissional_id_terca?: number | null;
  profissional_id_quarta?: number | null;
  profissional_id_quinta?: number | null;
  profissional_id_sexta?: number | null;
  profissional_id_sabado?: number | null;
  hora_domingo?: string;
  hora_segunda?: string;
  hora_terca?: string;
  hora_quarta?: string;
  hora_quinta?: string;
  hora_sexta?: string;
  hora_sabado?: string;
}

/**
 * PUT /api/plans/:planId/schedule
 * Update the schedule (days, hours, rooms, and professionals) for a plan (pacote).
 *
 * Body: UpdateScheduleBody
 */
router.put('/:planId/schedule', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const body: UpdateScheduleBody = req.body;

    if (!body.data_inicio_alteracao) {
      res.status(400).json({
        error: 'Missing required field: data_inicio_alteracao (YYYY-MM-DD)',
      });
      return;
    }

    // Build the payload matching SeuFisio's expected format
    const payload = {
      data_inicio_alteracao: body.data_inicio_alteracao,
      domingo: body.domingo ?? false,
      segunda: body.segunda ?? false,
      terca: body.terca ?? false,
      quarta: body.quarta ?? false,
      quinta: body.quinta ?? false,
      sexta: body.sexta ?? false,
      sabado: body.sabado ?? false,
      sala_id_domingo: body.sala_id_domingo ?? null,
      sala_id_segunda: body.sala_id_segunda ?? null,
      sala_id_terca: body.sala_id_terca ?? null,
      sala_id_quarta: body.sala_id_quarta ?? null,
      sala_id_quinta: body.sala_id_quinta ?? null,
      sala_id_sexta: body.sala_id_sexta ?? null,
      sala_id_sabado: body.sala_id_sabado ?? null,
      profissional_id_domingo: body.profissional_id_domingo ?? null,
      profissional_id_segunda: body.profissional_id_segunda ?? null,
      profissional_id_terca: body.profissional_id_terca ?? null,
      profissional_id_quarta: body.profissional_id_quarta ?? null,
      profissional_id_quinta: body.profissional_id_quinta ?? null,
      profissional_id_sexta: body.profissional_id_sexta ?? null,
      profissional_id_sabado: body.profissional_id_sabado ?? null,
      hora_domingo: body.hora_domingo ?? '',
      hora_segunda: body.hora_segunda ?? '',
      hora_terca: body.hora_terca ?? '',
      hora_quarta: body.hora_quarta ?? '',
      hora_quinta: body.hora_quinta ?? '',
      hora_sexta: body.hora_sexta ?? '',
      hora_sabado: body.hora_sabado ?? '',
    };

    console.log(`[Plans] Updating schedule for plan ${planId}`, JSON.stringify(payload));

    const result = await seufisioClient.put(
      `/api/pacote/${planId}/atualizar-horarios`,
      payload,
    );

    console.log(`[Plans] Schedule updated successfully for plan ${planId}`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Plans] Error updating schedule:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to update plan schedule',
      details: error?.response?.data || error.message,
    });
  }
});

export default router;
