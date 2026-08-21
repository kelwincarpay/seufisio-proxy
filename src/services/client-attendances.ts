import { seufisioClient } from './seufisio-client';
import { env } from '../config/env';

// Studio timezone is fixed UTC-3 (America/Sao_Paulo, no DST since 2019).
export const STUDIO_UTC_OFFSET = '-03:00';

/**
 * Build the class start as an absolute instant, interpreting the stored
 * date/time as studio local wall-clock (UTC-3). Returns null if unparseable.
 */
export function classStartInstant(date?: string, hour?: string): Date | null {
  if (!date || !hour) return null;
  const [h, m] = hour.split(':');
  const d = new Date(
    `${date}T${h.padStart(2, '0')}:${(m || '0').padStart(2, '0')}:00${STUDIO_UTC_OFFSET}`,
  );
  return isNaN(d.getTime()) ? null : d;
}

/** Hours from now until the class start (studio local time), or null. */
export function hoursUntilClass(date?: string, hour?: string): number | null {
  const start = classStartInstant(date, hour);
  if (!start) return null;
  return (start.getTime() - Date.now()) / 3_600_000;
}

/** Today's date (YYYY-MM-DD) in studio local time. */
export function studioToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

/** "8h" / "15h10" — friendly BR hour, used in every client-facing message. */
export function formatHour(hour: string): string {
  const [h, m] = (hour || '').split(':');
  const hh = parseInt(h, 10);
  const mm = parseInt(m || '0', 10);
  if (isNaN(hh)) return hour || '';
  return mm ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`;
}

/** Add N days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface NormalizedAttendance {
  id: number | null;
  data_atendimento: string | null;
  hora_atendimento: string | null;
  profissional_id: number | null;
  profissional_nome: string | null;
  tipo_atendimento_id: number | null;
  tipo_nome: string | null;
  status_id: number | null;
  status_nome: string | null;
  hours_until_class: number | null;
  cancellable: boolean;
}

/**
 * Normalize a SeuFisio report/attendance row into the shape the booking site
 * needs, adding the cancellation window. Field names are read defensively
 * since the report row shape can vary.
 */
export function normalizeAttendance(row: any): NormalizedAttendance {
  const date: string | null = row.data_atendimento ?? null;
  const rawHour: string | null = row.hora_atendimento ?? null;
  const h = hoursUntilClass(date ?? undefined, rawHour ?? undefined);
  return {
    id: row.id ?? row.atendimento_id ?? null,
    data_atendimento: date,
    hora_atendimento: rawHour ? String(rawHour).slice(0, 5) : null, // HH:mm
    profissional_id: row.profissional_id ?? null,
    profissional_nome: row.profissional_nome ?? null,
    tipo_atendimento_id: row.tipo_atendimento_id ?? null,
    tipo_nome: row.tipo_nome ?? row.tipo_atendimento_nome ?? null,
    status_id: row.status_id ?? row.status?.id ?? null,
    status_nome: row.status_nome ?? row.status?.nome ?? null,
    hours_until_class: h === null ? null : Number(h.toFixed(2)),
    cancellable: h !== null && h >= env.CANCELLATION_MIN_HOURS,
  };
}

export interface ListOptions {
  from?: string;
  to?: string;
  upcomingOnly?: boolean;
}

/**
 * List a client's attendances from the SeuFisio report, normalized and sorted.
 * NOTE: /api/relatorio/atendimento does NOT accept rowsPerPage='all' (it falls
 * back to 1 row per page), so we request a large numeric page size.
 */
export async function listClientAttendances(
  clienteId: string | number,
  opts: ListOptions = {},
): Promise<{ from: string; to: string; attendances: NormalizedAttendance[] }> {
  const from = opts.from || studioToday();
  const to = opts.to || addDays(from, 60);
  const upcomingOnly = opts.upcomingOnly ?? true;

  const data: any = await seufisioClient.get('/api/relatorio/atendimento', {
    descending: 'false',
    page: 1,
    rowsPerPage: 1000,
    filtro_data_atendimento_inicial: from,
    filtro_data_atendimento_final: to,
    filtro_ausencias_sem_reposicoes: '0',
    filtro_apenas_reposicoes: '0',
    filtro_cliente_id: clienteId,
  });

  const rows: any[] = Array.isArray(data) ? data : data?.data || data?.items || [];
  let attendances = rows.map(normalizeAttendance);

  if (upcomingOnly) {
    attendances = attendances.filter((a) => a.hours_until_class !== null && a.hours_until_class > 0);
  }

  attendances.sort((a, b) =>
    `${a.data_atendimento ?? ''} ${a.hora_atendimento ?? ''}`.localeCompare(
      `${b.data_atendimento ?? ''} ${b.hora_atendimento ?? ''}`,
    ),
  );

  return { from, to, attendances };
}

/** Full SeuFisio client detail record (used to read phone/name). */
export async function getClientDetail(id: string | number): Promise<any> {
  return seufisioClient.get(`/api/cliente/${id}`);
}
