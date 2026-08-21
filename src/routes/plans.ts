import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';
import { isSupabaseConfigured } from '../services/supabase';
import { applyDiscount } from '../services/charges';
import { registerOnboarding } from '../services/onboarding';
import {
  CreatePlanInput,
  DAY_NAMES as RECURRING_DAYS,
  buildPlanPayload,
  createPlan,
  findCycleCharge,
  getCurrentUserId,
  getTipoAtendimento,
  isValidPeriodicidade,
  monthlyValue,
  periodicidadeLabel,
  scheduleText,
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
      if (!d?.profissional_id || !d?.sala_id) {
        res.status(400).json({ error: `${d.dia} is missing profissional_id or sala_id` });
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

    // The monthly instalment: price-table column for this length, divided by months.
    const derived = monthlyValue(tipo, input.periodicidade);
    const valor = valor_congelado != null ? Number(valor_congelado) : derived;
    if (valor == null || !isFinite(valor)) {
      res.status(400).json({
        error: `"${tipo.nome}" has no price for ${periodicidadeLabel(input.periodicidade)}. Send valor_congelado to set it manually.`,
      });
      return;
    }

    const payload = buildPlanPayload(input, tipo, createdByUserId, valor);

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
        valor_mensal: plan.valor_congelado,
        horarios: scheduleText(input.dias),
      },
      validation,
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
 * GET /api/plans/recurring/:planId?cliente_id=216
 * Read a recurring plan (cliente-servico). The older GET /:planId only reads
 * `pacote` (pacote personalizado), which is a different entity.
 *
 * Sourced from the client's sales list, the only read of a recurring plan we have
 * captured. cliente_id is required because that list is per client.
 */
router.get('/recurring/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const clienteId = req.query.cliente_id;

    if (!clienteId) {
      res.status(400).json({ error: 'Missing required query param: cliente_id' });
      return;
    }

    const sales = await seufisioClient.get(`/api/cliente/${clienteId}/listar-vendas`, {
      tab: 'ativas',
      page: 1,
      per_page: 20,
    });

    const row = (sales?.data || []).find((s: any) => Number(s.id) === Number(planId));
    if (!row) {
      res.status(404).json({
        error: `Recurring plan ${planId} not found among client ${clienteId} active sales`,
      });
      return;
    }

    res.json({
      success: true,
      plan: {
        id: row.id,
        ciclo_id: row.cicloId,
        tipo_venda: row.tipoVenda,
        tipo_atendimento: row.tipoAtendimentoNome,
        tipo_atendimento_id: row.tipoAtendimentoId,
        periodicidade: row.periodicidade,
        periodicidade_label:
          row.periodicidade != null ? periodicidadeLabel(Number(row.periodicidade)) : null,
        inicio: row.dataInicial,
        validade: row.validade,
        valor_mensal: row.valor,
        horarios: row.informacoes || [],
        atendimentos_feitos: row.atendimentosFeitos,
        atendimentos_repor: row.atendimentosRepor,
        cobranca_automatica: row.cobrancaAutomatica,
        pausado_em: row.dataPause,
      },
    });
  } catch (error: any) {
    console.error('[Plans] Error reading recurring plan:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to read recurring plan',
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
