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

/** "8h" / "15h10" — friendly BR hour. */
function formatHour(hour: string): string {
  const [h, m] = hour.split(':');
  const hh = parseInt(h, 10);
  const mm = parseInt(m || '0', 10);
  return mm ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`;
}

/** "hoje às 8h" / "amanhã às 15h10" / "no dia 25/07 às 9h" (studio local time). */
function whenPhrase(date: string, hour: string): string {
  const t = formatHour(hour);
  const today = studioToday();
  const tomorrow = addDays(today, 1);
  if (date === today) return `hoje às ${t}`;
  if (date === tomorrow) return `amanhã às ${t}`;
  const [, mo, d] = date.split('-');
  return `no dia ${d}/${mo} às ${t}`;
}

function buildMessage(name: string, date: string, hour: string): string {
  const firstName = name ? name.split(' ')[0] : '';
  const greeting = firstName ? `Oi, ${firstName}!` : 'Oi!';
  const when = whenPhrase(date, hour);
  return (
    `${greeting} 💚\n\n` +
    `Passando aqui para te lembrar da sua sessão no MovArt Pilates ${when}.\n\n` +
    `📲 *Ao chegar no studio não se esqueça de fazer o check-in pelo aplicativo* 😉\n\n\n` +
    `_Você é a arte que se move_`
  );
}

export interface SweepSummary {
  prefs: number;
  checked: number;
  sent: number;
  skipped: number;
  failed: number;
  error?: string;
  dry_run?: boolean;
  would_send?: Array<{
    cliente_id: number;
    atendimento_id: number | null;
    phone: string;
    class_start: string;
    message: string;
  }>;
}

/**
 * One reminder sweep: for each enabled preference, find upcoming classes whose
 * "notify_minutes_before" window has been reached and send a WhatsApp reminder
 * once. Dedup relies on a "sent" row in notification_log (partial unique index),
 * so failed attempts retry on the next run.
 *
 * With { dryRun: true } it resolves recipients/messages but does NOT send or
 * write to the DB — returns what it *would* send in `would_send`.
 */
export async function runReminderSweep(opts: { dryRun?: boolean } = {}): Promise<SweepSummary> {
  const dryRun = Boolean(opts.dryRun);
  const summary: SweepSummary = { prefs: 0, checked: 0, sent: 0, skipped: 0, failed: 0 };
  if (dryRun) {
    summary.dry_run = true;
    summary.would_send = [];
  }

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

        // Phone: SeuFisio is the source of truth (the site writes it there); the
        // stored preference phone is only a fallback. Also gets the client's name.
        let phone = '';
        let name = '';
        try {
          const detail = await getClientDetail(clienteId);
          phone = firstNonEmpty(detail.telefone, detail.telefone_2, detail.celular);
          name = firstNonEmpty(detail.nome, detail.nome_registro);
        } catch (e: any) {
          console.error(`[Reminder] Could not fetch detail for ${clienteId}:`, e?.message);
        }
        if (!phone) phone = pref.phone || '';

        if (!phone) {
          summary.failed++;
          console.warn(`[Reminder] No phone for client ${clienteId}, attendance ${a.id}`);
          continue;
        }

        const message = buildMessage(name, a.data_atendimento, a.hora_atendimento);

        // Dry-run: report the resolved recipient/message without sending or writing.
        if (dryRun) {
          summary.would_send!.push({
            cliente_id: clienteId,
            atendimento_id: a.id,
            phone,
            class_start: start.toISOString(),
            message,
          });
          continue;
        }

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
