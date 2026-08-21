import { Router, Request, Response } from 'express';
import { isSupabaseConfigured } from '../services/supabase';
import { listContractStatus, missingRegistrationFields } from '../services/contracts';
import { getClientDetail } from '../services/client-attendances';
import {
  clearResendTimer,
  getOnboardingState,
  registerOnboarding,
  runOnboardingSweep,
} from '../services/onboarding';

const router = Router();

/** Guard: every route here needs Supabase. */
function requireSupabase(res: Response): boolean {
  if (!isSupabaseConfigured()) {
    res.status(503).json({ error: 'Onboarding is not configured (Supabase missing)' });
    return false;
  }
  return true;
}

/**
 * POST /api/onboarding
 * Register a plan for the onboarding flow and send the registration link.
 * POST /api/plans already does this — use it only for plans created elsewhere.
 *
 * Body: { cliente_id, plano_id, tipo_atendimento, dias_e_horarios, telefone? }
 */
router.post('/', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  try {
    const { cliente_id, plano_id, tipo_atendimento, dias_e_horarios, telefone } = req.body || {};
    if (!cliente_id || !plano_id) {
      res.status(400).json({ error: 'Missing required fields: cliente_id, plano_id' });
      return;
    }

    const result = await registerOnboarding({
      cliente_id: Number(cliente_id),
      plano_id: Number(plano_id),
      tipo_atendimento: tipo_atendimento || 'seu plano',
      dias_e_horarios: dias_e_horarios || '',
      telefone,
    });

    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Onboarding] register error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to register onboarding',
      details: error?.response?.data || error.message,
    });
  }
});

/**
 * GET /api/onboarding/:clienteId
 * Where the client stands: registration fields still missing, contract signatures,
 * and the stored state. This is what answers "o X já assinou?".
 */
router.get('/:clienteId', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  try {
    const clienteId = String(req.params.clienteId);

    const [rows, cliente] = await Promise.all([
      getOnboardingState(clienteId),
      getClientDetail(clienteId),
    ]);

    const faltando = missingRegistrationFields(cliente);
    const ativo = rows.find((r: any) => r.estado !== 'concluido') || rows[0];
    const contratos = ativo ? await listContractStatus(clienteId, ativo.plano_id) : [];

    res.json({
      success: true,
      cliente: { id: Number(clienteId), nome: cliente?.nome, telefone: cliente?.telefone || null },
      cadastro: {
        completo: faltando.length === 0,
        campos_faltando: faltando,
      },
      contratos: contratos.map((c) => ({
        id: c.id,
        nome: c.nome_contrato,
        assinado: c.assinado,
        assinado_em: c.data_hora_assinatura,
        abriu_sem_assinar: c.aberto_sem_assinar,
      })),
      onboarding: rows,
    });
  } catch (error: any) {
    console.error('[Onboarding] state error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to read onboarding state',
      details: error?.response?.data || error.message,
    });
  }
});

/**
 * POST /api/onboarding/:clienteId/resend
 * Clear the resend timer and run a sweep, so the pending message goes out now.
 * Use after adding a missing phone number.
 *
 * Body: { plano_id? }
 */
router.post('/:clienteId/resend', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  try {
    const clienteId = String(req.params.clienteId);
    const { plano_id } = req.body || {};

    const cleared = await clearResendTimer(clienteId, plano_id);
    if (cleared === 0) {
      res.status(404).json({
        error: `No pending onboarding found for client ${clienteId}`,
      });
      return;
    }

    const summary = await runOnboardingSweep();
    res.json({ success: true, linhas_liberadas: cleared, sweep: summary });
  } catch (error: any) {
    console.error('[Onboarding] resend error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to resend onboarding message',
      details: error?.response?.data || error.message,
    });
  }
});

/**
 * POST /api/onboarding/run-sweep
 * Run the sweep manually. Body: { dry_run? } — with dry_run it reports what it would
 * do without sending, generating contracts or writing state.
 */
router.post('/run-sweep', async (req: Request, res: Response) => {
  if (!requireSupabase(res)) return;
  try {
    const dryRun = req.body?.dry_run === true || req.query.dry_run === 'true';
    const summary = await runOnboardingSweep({ dryRun });
    res.json({ success: !summary.error, ...summary });
  } catch (error: any) {
    console.error('[Onboarding] sweep error:', error?.message);
    res.status(500).json({ error: 'Failed to run onboarding sweep', details: error?.message });
  }
});

export default router;
