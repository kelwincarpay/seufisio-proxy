/**
 * Calendar slots. Shared by the calendar route and by the professional assignment
 * used when creating plans, so both read availability the same way.
 */
import { seufisioClient } from './seufisio-client';

export interface CalendarSlot {
  slot_id: number;
  grupo_id: number;
  profissional_id: number;
  profissional_nome: string | null;
  occur_date: string;
  start_time: string;
  end_time: string;
  total_capacity: number;
  total_booked: number;
  available: boolean;
  available_spots: number;
}

function mapSlot(slot: any, profId: number, profName: string | null): CalendarSlot {
  return {
    slot_id: slot.id,
    grupo_id: slot.grupo_id,
    profissional_id: profId,
    profissional_nome: profName,
    occur_date: slot.occur_date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    total_capacity: slot.total_capacity,
    total_booked: slot.total_booked,
    available: slot.total_booked < slot.total_capacity,
    available_spots: slot.total_capacity - slot.total_booked,
  };
}

export async function getSlotsForProfessional(
  profId: number,
  profName: string | null,
  date: string,
): Promise<CalendarSlot[]> {
  try {
    const slots: any[] = await seufisioClient.get('/api/slots/calendario', {
      data_inicial: `${date}T00:00:00`,
      data_final: `${date}T23:59:59`,
      profissional_id: profId,
    });
    return (slots || []).map((s) => mapSlot(s, profId, profName));
  } catch (err: any) {
    console.error(
      `[Calendar] Failed to fetch slots for professional ${profId}:`,
      err?.response?.status || err?.message,
    );
    return [];
  }
}

/** Every slot on a date. Without profissionalId, covers all active professionals. */
export async function getSlotsForDate(
  date: string,
  profissionalId?: number | null,
): Promise<CalendarSlot[]> {
  if (profissionalId) {
    return getSlotsForProfessional(Number(profissionalId), null, date);
  }

  const professionals: any[] = await seufisioClient.get('/api/profissional/todos-profissionais');
  const active = (professionals || []).filter((p: any) => p.ativo);

  const all: CalendarSlot[] = [];
  for (const prof of active) {
    all.push(...(await getSlotsForProfessional(prof.id, prof.nome, date)));
  }
  return all;
}

/** "09:00" matches a slot whose start_time is "09:00:00". */
export function slotStartsAt(slot: CalendarSlot, hora: string): boolean {
  return String(slot.start_time || '').slice(0, 5) === String(hora || '').slice(0, 5);
}

/** Distinct start times on a date, sorted — for suggesting alternatives. */
export function startTimes(slots: CalendarSlot[]): string[] {
  return [...new Set(slots.map((s) => String(s.start_time || '').slice(0, 5)))].sort();
}
