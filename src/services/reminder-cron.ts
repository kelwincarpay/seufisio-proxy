import cron from 'node-cron';
import { env } from '../config/env';
import { getSupabase } from './supabase';
import { isEvolutionConfigured, sendText } from './evolution';
import {
  listClientAttendances,
  getClientDetail,
  classStartInstant,
  studioToday,
  addDays,
} from './client-attendances';

/** Prevent overlapping sweeps within this process. */
let sweepRunning = false;

function firstNonEmpty(...values: any[]): string {
  for (const v of values) {
    const s = v != null ? String(v).trim() : '';
    if (s) return s;
  }
  return '';
}

function buildMessage(name: string, tipo: string | null, date: string, hour: string): string {
  const firstName = name ? name.split(' ')[0] : '';
  const greeting = firstName ? `Olá, ${firstName}!` : 'Olá!';
  const [y, mo, d] = date.split('-');
  const prettyDate = y && mo && d ? `${d}/${mo}` : date;
  const aula = tipo ? ` de ${tipo}` : '';
  return (
    `${greeting} 🧘\n\n` +
    `Passando para lembrar da sua aula${aula} na MovArt Pilates em ${prettyDate} às ${hour}.\n\n` +
    `Se não puder comparecer, cancele com pelo menos 8h de antecedência. Até já!`
  );
}

export interface SweepSummary {
  prefs: number;
  checked: number;
  sent: number;
  skipped: number;
  failed: number;
  error?: string;
}

/**
 * One reminder sweep: for each enabled preference, find upcoming classes whose
 * "notify_minutes_before" window has been reached and send a WhatsApp reminder
 * once. Dedup relies on a "sent" row in notification_log (partial unique index),
 * so failed attempts retry on the next run.
 */
export async function runReminderSweep(): Promise<SweepSummary> {
  const summary: SweepSummary = { prefs: 0, checked: 0, sent: 0, skipped: 0, failed: 0 };

  const supabase = getSupabase();
  if (!supabase) {
    summary.error = 'Supabase not configured';
    return summary;
  }
  if (sweepRunning) {
    summary.error = 'Sweep already running';
    return summary;
  }
  sweepRunning = true;

  try {
    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('enabled', true);
    if (error) throw error;

    summary.prefs = prefs?.length || 0;
    const from = studioToday();
    const to = addDays(from, env.NOTIFY_LOOKAHEAD_DAYS);
    const now = Date.now();

    for (const pref of prefs || []) {
      const clienteId = pref.seufisio_cliente_id;

      let attendances;
      try {
        ({ attendances } = await listClientAttendances(clienteId, { from, to, upcomingOnly: true }));
      } catch (e: any) {
        console.error(`[Reminder] Failed to list attendances for ${clienteId}:`, e?.message);
        continue;
      }

      for (const a of attendances) {
        if (!a.id || !a.data_atendimento || !a.hora_atendimento) continue;
        const start = classStartInstant(a.data_atendimento, a.hora_atendimento);
        if (!start) continue;

        const fireAt = start.getTime() - pref.notify_minutes_before * 60_000;
        if (now < fireAt) continue; // reminder window not reached yet
        if (start.getTime() <= now) continue; // class already started

        summary.checked++;

        // Dedup: skip if a successful reminder already went out for this class.
        const { data: existing } = await supabase
          .from('notification_log')
          .select('id')
          .eq('atendimento_id', a.id)
          .eq('status', 'sent')
          .limit(1);
        if (existing && existing.length) {
          summary.skipped++;
          continue;
        }

        // Refresh phone/name from SeuFisio (falls back to the stored phone).
        let phone = pref.phone || '';
        let name = '';
        try {
          const detail = await getClientDetail(clienteId);
          phone = firstNonEmpty(detail.telefone, detail.telefone_2, detail.celular, phone);
          name = firstNonEmpty(detail.nome, detail.nome_registro);
        } catch (e: any) {
          console.error(`[Reminder] Could not fetch detail for ${clienteId}:`, e?.message);
        }

        if (!phone) {
          summary.failed++;
          console.warn(`[Reminder] No phone for client ${clienteId}, attendance ${a.id}`);
          continue;
        }

        const message = buildMessage(name, a.tipo_nome, a.data_atendimento, a.hora_atendimento);

        let ok = false;
        let providerResponse: any = null;
        if (isEvolutionConfigured()) {
          const result = await sendText(phone, message);
          ok = result.ok;
          providerResponse = result.data;
        } else {
          providerResponse = { error: 'Evolution not configured' };
        }

        // Log the attempt. The partial unique index (status='sent') guards against
        // a duplicate successful row if two sweeps ever race.
        const { error: logErr } = await supabase.from('notification_log').insert({
          seufisio_cliente_id: clienteId,
          atendimento_id: a.id,
          class_start: start.toISOString(),
          notify_minutes_before: pref.notify_minutes_before,
          phone,
          status: ok ? 'sent' : 'failed',
          provider_response: providerResponse,
        });
        if (logErr) {
          // Likely a unique-violation from a concurrent sweep — treat as already sent.
          console.warn(`[Reminder] log insert for attendance ${a.id}:`, logErr.message);
          summary.skipped++;
          continue;
        }

        if (ok) summary.sent++;
        else summary.failed++;
      }
    }
  } catch (e: any) {
    console.error('[Reminder] Sweep error:', e?.message || e);
    summary.error = e?.message || String(e);
  } finally {
    sweepRunning = false;
  }

  console.log('[Reminder] Sweep summary:', JSON.stringify(summary));
  return summary;
}

/** Start the recurring reminder sweep (no-op if Supabase is not configured). */
export function startReminderCron(): void {
  if (!getSupabase()) {
    console.log('[Reminder] Supabase not configured — reminder cron disabled.');
    return;
  }
  if (!cron.validate(env.NOTIFICATIONS_CRON)) {
    console.error(`[Reminder] Invalid NOTIFICATIONS_CRON "${env.NOTIFICATIONS_CRON}" — cron disabled.`);
    return;
  }
  cron.schedule(env.NOTIFICATIONS_CRON, () => {
    runReminderSweep().catch((e) => console.error('[Reminder] Unhandled sweep error:', e));
  });
  console.log(`[Reminder] Cron scheduled (${env.NOTIFICATIONS_CRON}).`);
}
