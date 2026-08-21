/**
 * Picking the professional (and room) for a weekly slot.
 *
 * Same rule the create-attendance and change-schedule flows already use: take the next
 * occurrence of that weekday, read the calendar, and use the professional whose slot
 * starts at the requested time. Implemented here so the plan flow does not reinvent it
 * and the two cannot drift apart.
 */
import { seufisioClient } from './seufisio-client';
import { addDays, studioToday } from './client-attendances';
import { CalendarSlot, getSlotsForDate, slotStartsAt, startTimes } from './calendar';
import { DAY_NAMES, DayName } from './recurring-plans';

export interface AssignedDay {
  dia: DayName;
  hora: string;
  profissional_id: number;
  profissional_nome: string | null;
  sala_id: number;
  /** The date whose calendar was read to make the choice. */
  data_referencia: string;
  vagas: number;
  /** The slot exists but is already full. Not a blocker — the studio allows it. */
  lotado: boolean;
  /** true when the proxy chose it, false when the caller passed it in. */
  atribuido_automaticamente: boolean;
}

export interface AssignmentProblem {
  dia: DayName;
  hora: string;
  motivo: string;
  horarios_disponiveis: string[];
}

/** First occurrence of a weekday on or after `fromDate` (YYYY-MM-DD). */
export function nextOccurrence(dia: DayName, fromDate: string): string {
  const target = DAY_NAMES.indexOf(dia);
  let date = fromDate;
  for (let i = 0; i < 7; i++) {
    if (new Date(`${date}T12:00:00Z`).getUTCDay() === target) return date;
    date = addDays(date, 1);
  }
  return fromDate;
}

/**
 * The studio's room. There is only one (Sala 01), so it is resolved rather than
 * hardcoded — and if a second active room ever appears, this returns null so the
 * caller has to be explicit instead of silently guessing.
 */
export async function resolveDefaultRoomId(): Promise<number | null> {
  const rooms: any[] = await seufisioClient.get('/api/sala', { rowsPerPage: 'all' });
  const active = (rooms || []).filter((r: any) => r.ativo);
  return active.length === 1 ? Number(active[0].id) : null;
}

/** Prefer a slot with room left; otherwise the fullest-but-existing one. */
function pickSlot(slots: CalendarSlot[], hora: string): CalendarSlot | null {
  const atTime = slots.filter((s) => slotStartsAt(s, hora));
  if (atTime.length === 0) return null;
  const free = atTime.filter((s) => s.available);
  const pool = free.length > 0 ? free : atTime;
  return pool.reduce((best, s) => (s.available_spots > best.available_spots ? s : best), pool[0]);
}

export interface DayRequest {
  dia: DayName;
  hora: string;
  profissional_id?: number | null;
  sala_id?: number | null;
}

export interface AssignmentResult {
  dias: AssignedDay[];
  problemas: AssignmentProblem[];
}

/**
 * Resolve professional and room for each requested day. Days that already carry a
 * `profissional_id` are kept as given — the caller wins over the calendar.
 *
 * A day whose requested time has no slot at all is a problem: nobody works then, and
 * there is no professional to assign. A slot that exists but is full is NOT a problem
 * (the studio does not block on capacity) — it comes back flagged `lotado`.
 */
export async function assignProfessionals(
  requested: DayRequest[],
  inicioServico: string,
): Promise<AssignmentResult> {
  const dias: AssignedDay[] = [];
  const problemas: AssignmentProblem[] = [];

  // Anchor on the first session that still lies ahead: a plan backdated to last month
  // should be staffed by who is available now, not by a calendar already past.
  const anchor = inicioServico > studioToday() ? inicioServico : studioToday();

  let defaultRoom: number | null | undefined;

  for (const req of requested) {
    const data = nextOccurrence(req.dia, anchor);

    if (req.profissional_id) {
      // Caller decided. Still read the slot to report capacity honestly.
      const slots = await getSlotsForDate(data, req.profissional_id);
      const slot = pickSlot(slots, req.hora);
      if (defaultRoom === undefined) defaultRoom = await resolveDefaultRoomId();
      const sala = req.sala_id ?? defaultRoom;
      if (!sala) {
        problemas.push({
          dia: req.dia,
          hora: req.hora,
          motivo: 'sala_id é obrigatório: o studio tem mais de uma sala ativa',
          horarios_disponiveis: [],
        });
        continue;
      }
      dias.push({
        dia: req.dia,
        hora: req.hora,
        profissional_id: Number(req.profissional_id),
        profissional_nome: slot?.profissional_nome ?? null,
        sala_id: Number(sala),
        data_referencia: data,
        vagas: slot?.available_spots ?? 0,
        lotado: slot ? !slot.available : false,
        atribuido_automaticamente: false,
      });
      continue;
    }

    const slots = await getSlotsForDate(data);
    const slot = pickSlot(slots, req.hora);

    if (!slot) {
      problemas.push({
        dia: req.dia,
        hora: req.hora,
        motivo: `Nenhum horário de ${req.hora} na agenda de ${req.dia} (referência ${data})`,
        horarios_disponiveis: startTimes(slots.filter((s) => s.available)),
      });
      continue;
    }

    if (defaultRoom === undefined) defaultRoom = await resolveDefaultRoomId();
    const sala = req.sala_id ?? defaultRoom;
    if (!sala) {
      problemas.push({
        dia: req.dia,
        hora: req.hora,
        motivo: 'sala_id é obrigatório: o studio tem mais de uma sala ativa',
        horarios_disponiveis: [],
      });
      continue;
    }

    dias.push({
      dia: req.dia,
      hora: req.hora,
      profissional_id: slot.profissional_id,
      profissional_nome: slot.profissional_nome,
      sala_id: Number(sala),
      data_referencia: data,
      vagas: slot.available_spots,
      lotado: !slot.available,
      atribuido_automaticamente: true,
    });
  }

  return { dias, problemas };
}
