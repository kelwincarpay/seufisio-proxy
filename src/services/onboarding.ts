/**
 * Post-sale onboarding state machine: registration → contracts → signatures.
 *
 * Design: docs/onboarding-plano.md. One sweep over one Supabase table, instead of
 * one cron per client — the state lives in the database, so a Railway restart loses
 * nothing and every transition is idempotent.
 *
 * Timestamps double as the retry mechanism: a null "sent at" means "send on the next
 * sweep", and it is only stamped after the message actually goes out. So a failed
 * WhatsApp send retries, while contract generation never repeats.
 */
import { getSupabase } from './supabase';
import { env } from '../config/env';
import { isEvolutionConfigured, normalizePhone, sendText } from './evolution';
import { getClientDetail } from './client-attendances';
import {
  generatePlanContracts,
  getContractLink,
  getRegistrationLink,
  listContractStatus,
  missingRegistrationFields,
} from './contracts';
import {
  contractsReady,
  onboardingComplete,
  PendingContract,
  registrationReminder,
  registrationRequest,
  signatureReminder,
} from './onboarding-messages';

export const ONBOARDING_TABLE = 'client_onboarding';
export const ONBOARDING_LOG_TABLE = 'onboarding_log';

export type OnboardingState = 'cadastro_pendente' | 'contrato_pendente' | 'concluido';

export type MessageKind =
  | 'cadastro'
  | 'cadastro_reenvio'
  | 'contratos'
  | 'assinatura_reenvio'
  | 'concluido';

/** Prevent overlapping sweeps within this process. */
let sweepRunning = false;

function nowIso(): string {
  return new Date().toISOString();
}

function hoursSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return (Date.now() - t) / 3_600_000;
}

/** Due when it was never sent, or when the resend window has elapsed. */
function isDue(sentAt?: string | null): boolean {
  const hours = hoursSince(sentAt);
  return hours === null || hours >= env.ONBOARDING_RESEND_HOURS;
}

function firstNonEmpty(...values: any[]): string {
  for (const v of values) {
    const s = v != null ? String(v).trim() : '';
    if (s) return s;
  }
  return '';
}

async function logSend(
  clienteId: number,
  planoId: number | null,
  kind: MessageKind,
  phone: string,
  ok: boolean,
  providerResponse: any,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from(ONBOARDING_LOG_TABLE).insert({
    seufisio_cliente_id: clienteId,
    plano_id: planoId,
    tipo: kind,
    phone,
    status: ok ? 'sent' : 'failed',
    provider_response: providerResponse,
  });
  if (error) console.warn(`[Onboarding] log insert (${kind}) for ${clienteId}:`, error.message);
}

/** Send one message and log the attempt. Never throws. */
async function deliver(
  clienteId: number,
  planoId: number | null,
  kind: MessageKind,
  phone: string,
  message: string,
): Promise<boolean> {
  if (!phone) {
    await logSend(clienteId, planoId, kind, '', false, { error: 'no phone' });
    return false;
  }
  if (!isEvolutionConfigured()) {
    await logSend(clienteId, planoId, kind, phone, false, { error: 'Evolution not configured' });
    return false;
  }
  const result = await sendText(phone, message);
  await logSend(clienteId, planoId, kind, phone, result.ok, result.data);
  return result.ok;
}

export interface RegisterInput {
  cliente_id: number;
  plano_id: number;
  nome?: string;
  tipo_atendimento: string;
  dias_e_horarios: string;
  telefone?: string;
}

export interface RegisterResult {
  estado: OnboardingState;
  link_cadastro: string;
  telefone: string;
  mensagem_enviada: boolean;
  /** Set when there is no phone on file — the agent has to ask for one. */
  telefone_ausente?: boolean;
}

/**
 * Register a fresh plan for onboarding and send the registration link. Called by
 * POST /api/plans, so the agent cannot forget it.
 */
export async function registerOnboarding(input: RegisterInput): Promise<RegisterResult> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Onboarding requires Supabase (SUPABASE_URL / SERVICE_ROLE_KEY)');

  const cliente = await getClientDetail(input.cliente_id);
  const nome = firstNonEmpty(input.nome, cliente?.nome, cliente?.nome_registro);
  const phone = normalizePhone(firstNonEmpty(input.telefone, cliente?.telefone, cliente?.telefone_2));
  const link = await getRegistrationLink(input.cliente_id);

  const { error } = await supabase.from(ONBOARDING_TABLE).upsert(
    {
      seufisio_cliente_id: input.cliente_id,
      plano_id: input.plano_id,
      estado: 'cadastro_pendente',
      telefone: phone || null,
      link_cadastro: link,
      link_cadastro_enviado_em: null,
      tentativas_cadastro: 0,
      updated_at: nowIso(),
    },
    { onConflict: 'seufisio_cliente_id,plano_id' },
  );
  if (error) throw new Error(`Failed to register onboarding: ${error.message}`);

  let sent = false;
  if (phone) {
    const message = registrationRequest({
      nome,
      tipo_atendimento: input.tipo_atendimento,
      dias_e_horarios: input.dias_e_horarios,
      link,
    });
    sent = await deliver(input.cliente_id, input.plano_id, 'cadastro', phone, message);
    if (sent) {
      await supabase
        .from(ONBOARDING_TABLE)
        .update({
          link_cadastro_enviado_em: nowIso(),
          tentativas_cadastro: 1,
          updated_at: nowIso(),
        })
        .eq('seufisio_cliente_id', input.cliente_id)
        .eq('plano_id', input.plano_id);
    }
  }

  return {
    estado: 'cadastro_pendente',
    link_cadastro: link,
    telefone: phone,
    mensagem_enviada: sent,
    ...(phone ? {} : { telefone_ausente: true }),
  };
}

export interface SweepSummary {
  rows: number;
  cadastro_reenviado: number;
  contratos_gerados: number;
  assinatura_cobrada: number;
  concluidos: number;
  falhas: number;
  dry_run?: boolean;
  acoes?: Array<{ cliente_id: number; plano_id: number; acao: string; detalhe?: string }>;
  error?: string;
}

/**
 * One onboarding sweep. With { dryRun: true } it resolves what it *would* do without
 * sending, generating contracts or writing state.
 */
export async function runOnboardingSweep(
  options: { dryRun?: boolean } = {},
): Promise<SweepSummary> {
  const dryRun = Boolean(options.dryRun);
  const summary: SweepSummary = {
    rows: 0,
    cadastro_reenviado: 0,
    contratos_gerados: 0,
    assinatura_cobrada: 0,
    concluidos: 0,
    falhas: 0,
    ...(dryRun ? { dry_run: true, acoes: [] } : {}),
  };

  const supabase = getSupabase();
  if (!supabase) {
    summary.error = 'Supabase not configured';
    return summary;
  }
  if (sweepRunning) {
    summary.error = 'sweep already running';
    return summary;
  }
  sweepRunning = true;

  const note = (clienteId: number, planoId: number, acao: string, detalhe?: string) => {
    if (summary.acoes) summary.acoes.push({ cliente_id: clienteId, plano_id: planoId, acao, detalhe });
  };

  try {
    const { data: rows, error } = await supabase
      .from(ONBOARDING_TABLE)
      .select('*')
      .neq('estado', 'concluido');
    if (error) throw new Error(error.message);

    summary.rows = rows?.length || 0;

    for (const row of rows || []) {
      const clienteId = Number(row.seufisio_cliente_id);
      const planoId = Number(row.plano_id);

      try {
        const cliente = await getClientDetail(clienteId);
        const nome = firstNonEmpty(cliente?.nome, cliente?.nome_registro);
        const phone = normalizePhone(
          firstNonEmpty(row.telefone, cliente?.telefone, cliente?.telefone_2),
        );

        if (row.estado === 'cadastro_pendente') {
          const missing = missingRegistrationFields(cliente);

          if (missing.length === 0) {
            if (dryRun) {
              note(clienteId, planoId, 'gerar contratos');
              continue;
            }
            const contracts = await generatePlanContracts(clienteId, planoId);
            const [contrato, termo] = contracts;

            // Persist the ids before sending: contracts must never be generated twice.
            await supabase
              .from(ONBOARDING_TABLE)
              .update({
                estado: 'contrato_pendente',
                cadastro_completo_em: nowIso(),
                contrato_cliente_id: contrato?.id ?? null,
                contrato_termo_id: termo?.id ?? null,
                contratos_enviados_em: null,
                tentativas_contrato: 0,
                ultimo_erro: null,
                updated_at: nowIso(),
              })
              .eq('seufisio_cliente_id', clienteId)
              .eq('plano_id', planoId);
            summary.contratos_gerados++;

            const pending: PendingContract[] = contracts.map((c) => ({
              id: c.id,
              nome_contrato: c.nome_contrato,
              link: c.link,
              aberto: false,
            }));
            const ok = await deliver(
              clienteId,
              planoId,
              'contratos',
              phone,
              contractsReady({ nome, contracts: pending }),
            );
            if (ok) {
              await supabase
                .from(ONBOARDING_TABLE)
                .update({ contratos_enviados_em: nowIso(), tentativas_contrato: 1, updated_at: nowIso() })
                .eq('seufisio_cliente_id', clienteId)
                .eq('plano_id', planoId);
            } else {
              summary.falhas++;
            }
            continue;
          }

          if (!isDue(row.link_cadastro_enviado_em)) continue;

          if (dryRun) {
            note(clienteId, planoId, 'reenviar cadastro', `faltando: ${missing.join(', ')}`);
            continue;
          }

          const link = row.link_cadastro || (await getRegistrationLink(clienteId));
          const ok = await deliver(
            clienteId,
            planoId,
            'cadastro_reenvio',
            phone,
            registrationReminder({ nome, link }),
          );
          if (ok) {
            await supabase
              .from(ONBOARDING_TABLE)
              .update({
                link_cadastro: link,
                link_cadastro_enviado_em: nowIso(),
                tentativas_cadastro: Number(row.tentativas_cadastro || 0) + 1,
                updated_at: nowIso(),
              })
              .eq('seufisio_cliente_id', clienteId)
              .eq('plano_id', planoId);
            summary.cadastro_reenviado++;
          } else {
            summary.falhas++;
          }
          continue;
        }

        if (row.estado === 'contrato_pendente') {
          const status = await listContractStatus(clienteId, planoId);
          if (status.length === 0) {
            console.warn(`[Onboarding] no contracts found for plan ${planoId} (client ${clienteId})`);
            continue;
          }

          const pendentes = status.filter((c) => !c.assinado);

          if (pendentes.length === 0) {
            if (dryRun) {
              note(clienteId, planoId, 'concluir');
              continue;
            }
            const ok = await deliver(
              clienteId,
              planoId,
              'concluido',
              phone,
              onboardingComplete({ nome }),
            );
            await supabase
              .from(ONBOARDING_TABLE)
              .update({
                estado: 'concluido',
                contratos_assinados_em: nowIso(),
                updated_at: nowIso(),
              })
              .eq('seufisio_cliente_id', clienteId)
              .eq('plano_id', planoId);
            summary.concluidos++;
            if (!ok) summary.falhas++;
            continue;
          }

          if (!isDue(row.contratos_enviados_em)) continue;

          if (dryRun) {
            note(
              clienteId,
              planoId,
              'cobrar assinatura',
              pendentes.map((p) => p.nome_contrato).join(', '),
            );
            continue;
          }

          const withLinks: PendingContract[] = [];
          for (const p of pendentes) {
            withLinks.push({
              id: p.id,
              nome_contrato: p.nome_contrato,
              link: await getContractLink(p.id),
              aberto: p.aberto_sem_assinar,
            });
          }

          const ok = await deliver(
            clienteId,
            planoId,
            'assinatura_reenvio',
            phone,
            signatureReminder({ nome, contracts: withLinks }),
          );
          if (ok) {
            await supabase
              .from(ONBOARDING_TABLE)
              .update({
                contratos_enviados_em: nowIso(),
                tentativas_contrato: Number(row.tentativas_contrato || 0) + 1,
                updated_at: nowIso(),
              })
              .eq('seufisio_cliente_id', clienteId)
              .eq('plano_id', planoId);
            summary.assinatura_cobrada++;
          } else {
            summary.falhas++;
          }
        }
      } catch (e: any) {
        const message = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || String(e);
        console.error(`[Onboarding] client ${clienteId} plan ${planoId}:`, message);
        summary.falhas++;
        if (!dryRun) {
          await supabase
            .from(ONBOARDING_TABLE)
            .update({ ultimo_erro: message.slice(0, 500), updated_at: nowIso() })
            .eq('seufisio_cliente_id', clienteId)
            .eq('plano_id', planoId);
        }
      }
    }
  } catch (e: any) {
    summary.error = e?.message || String(e);
    console.error('[Onboarding] Sweep error:', summary.error);
  } finally {
    sweepRunning = false;
  }

  console.log('[Onboarding] Sweep summary:', JSON.stringify(summary));
  return summary;
}

/**
 * Force the next sweep to resend for this client by clearing the relevant timer.
 * Which timer depends on the state the row is in.
 */
export async function clearResendTimer(
  clienteId: number | string,
  planoId?: number | string,
): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Onboarding requires Supabase');

  const rows = await getOnboardingState(clienteId);
  const targets = rows.filter(
    (r) => r.estado !== 'concluido' && (planoId == null || String(r.plano_id) === String(planoId)),
  );

  for (const row of targets) {
    const patch =
      row.estado === 'contrato_pendente'
        ? { contratos_enviados_em: null, updated_at: nowIso() }
        : { link_cadastro_enviado_em: null, updated_at: nowIso() };
    await supabase
      .from(ONBOARDING_TABLE)
      .update(patch)
      .eq('seufisio_cliente_id', row.seufisio_cliente_id)
      .eq('plano_id', row.plano_id);
  }
  return targets.length;
}

/** Current onboarding state for a client (most recent plan first). */
export async function getOnboardingState(clienteId: number | string): Promise<any[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Onboarding requires Supabase');
  const { data, error } = await supabase
    .from(ONBOARDING_TABLE)
    .select('*')
    .eq('seufisio_cliente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
