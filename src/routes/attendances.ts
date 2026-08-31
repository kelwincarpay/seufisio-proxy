import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';
import { env } from '../config/env';
import { hoursUntilClass, listClientAttendances } from '../services/client-attendances';

const router = Router();

/** Lowercase + strip accents, for tolerant name matching. */
function deaccent(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Resolve an aggregator app source to its tipo_atendimento_id.
 * Prefers the env override; falls back to matching the tipo name in SeuFisio.
 *   totalpass -> "TotalPass"
 *   wellhub   -> "Sessão Avulsa"
 */
async function resolveTipoAtendimentoId(source: string): Promise<number> {
  const normalized = deaccent(source);

  if (normalized === 'totalpass') {
    if (env.TIPO_TOTALPASS_ID) return env.TIPO_TOTALPASS_ID;
    return findTipoIdByName(['totalpass', 'total pass']);
  }
  if (normalized === 'wellhub') {
    if (env.TIPO_WELLHUB_ID) return env.TIPO_WELLHUB_ID;
    return findTipoIdByName(['sessao avulsa', 'avulsa']);
  }
  throw new Error(`Unknown source "${source}" (expected "totalpass" or "wellhub")`);
}

async function findTipoIdByName(candidates: string[]): Promise<number> {
  const types: any[] = await seufisioClient.get('/api/tipo-atendimento', { rowsPerPage: 'all' });
  const wanted = candidates.map(deaccent);
  const match = (types || [])
    .filter((t: any) => t.ativo)
    .find((t: any) => {
      const name = deaccent(t.nome);
      return wanted.some((w) => name === w || name.includes(w));
    });
  if (!match) {
    throw new Error(
      `No active tipo_atendimento found matching ${JSON.stringify(candidates)}. ` +
        `Set the TIPO_TOTALPASS_ID / TIPO_WELLHUB_ID env var explicitly.`,
    );
  }
  return match.id;
}

async function listStatuses(): Promise<any[]> {
  const statuses: any = await seufisioClient.get('/api/status', { rowsPerPage: 'all' });
  return Array.isArray(statuses) ? statuses : statuses?.data || [];
}

/**
 * Resolve the status a cancelled booking should get ("Não Compareceu" at the
 * studio). Returns the full status object so the PUT can carry a consistent
 * nested `status` — SeuFisio keeps the old status when the nested object still
 * points at it, even with a new status_id.
 */
async function resolveCancelledStatus(): Promise<{ id: number; status: any | null }> {
  const list = await listStatuses();
  if (env.CANCELLED_STATUS_ID) {
    return {
      id: env.CANCELLED_STATUS_ID,
      status: list.find((s: any) => s.id === env.CANCELLED_STATUS_ID) || null,
    };
  }
  const match =
    list.find((s: any) => deaccent(s.nome).includes('nao compareceu')) ||
    list.find((s: any) => deaccent(s.nome).includes('cancel'));
  if (!match) {
    throw new Error(
      'Could not resolve a cancelled status. Set the CANCELLED_STATUS_ID env var explicitly.',
    );
  }
  return { id: match.id, status: match };
}

/**
 * SeuFisio's PUT /api/atendimento/:id validation is stricter than what its own
 * GET returns: hora_atendimento / hora_final_atendimento must be H:i (the GET
 * gives H:i:s), and duracao_atendimento / pertence_pacote are required but
 * absent from the GET. Normalize a fetched attendance so it can be PUT back.
 */
function normalizeAttendanceForPut(attendance: Record<string, any>): Record<string, any> {
  const toHi = (v: any) => (typeof v === 'string' ? v.slice(0, 5) : v);
  const payload = { ...attendance };

  payload.hora_atendimento = toHi(payload.hora_atendimento);
  payload.hora_final_atendimento = toHi(payload.hora_final_atendimento);

  if (payload.duracao_atendimento == null) {
    const start = payload.hora_atendimento;
    const end = payload.hora_final_atendimento;
    let duration: number | null = null;
    if (typeof start === 'string' && typeof end === 'string') {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      if ([sh, sm, eh, em].every(Number.isFinite)) {
        duration = eh * 60 + em - (sh * 60 + sm);
      }
    }
    payload.duracao_atendimento =
      duration && duration > 0 ? duration : payload.tipo?.periodo_atendimento || 50;
  }

  if (payload.pertence_pacote == null) {
    payload.pertence_pacote = payload.pacote_id || payload.pacote_fixo_id ? 1 : 0;
  }

  // A nested `status` object pointing at the old status makes SeuFisio keep it
  // even when status_id changed. Drop it when it disagrees (or is empty).
  if (payload.status == null || payload.status.id !== payload.status_id) {
    delete payload.status;
  }

  return payload;
}

/**
 * GET /api/attendances?profissional_id=<id>&start=<unix>&end=<unix>
 * List basic attendance events for a professional in a date range
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { profissional_id, start, end } = req.query;

    if (!profissional_id || !start || !end) {
      res.status(400).json({
        error: 'Missing required query parameters: profissional_id, start, end',
      });
      return;
    }

    const data = await seufisioClient.get('/api/basic-events', {
      profissional_id,
      start,
      end,
    });

    const attendances = (data || []).map((event: any) => ({
      title: event.title,
      start: event.start,
      end: event.end,
      content: event.content,
    }));

    res.json({ attendances });
  } catch (error: any) {
    console.error('[Attendances] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch attendances' });
  }
});

/**
 * GET /api/attendances/report?client_id=<id>&start_date=<YYYY-MM-DD>&end_date=<YYYY-MM-DD>&page=<n>&rows_per_page=<n>&only_absences=<0|1>&only_repositions=<0|1>
 * List attendance report for a client within a date range
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    const {
      client_id,
      start_date,
      end_date,
      page = '1',
      rows_per_page = '100',
      only_absences = '0',
      only_repositions = '0',
    } = req.query;

    if (!client_id || !start_date || !end_date) {
      res.status(400).json({
        error: 'Missing required query parameters: client_id, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)',
      });
      return;
    }

    const data = await seufisioClient.get('/api/relatorio/atendimento', {
      descending: 'false',
      page,
      rowsPerPage: rows_per_page,
      filtro_data_atendimento_inicial: start_date,
      filtro_data_atendimento_final: end_date,
      filtro_ausencias_sem_reposicoes: only_absences,
      filtro_apenas_reposicoes: only_repositions,
      filtro_cliente_id: client_id,
    });

    res.json(data);
  } catch (error: any) {
    console.error('[Attendances Report] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch attendance report' });
  }
});

/**
 * GET /api/attendances/client/:clientId
 * Normalized list of a client's attendances for the booking site ("meus agendamentos").
 *
 * Query:
 *   from?    YYYY-MM-DD (default: today, studio time)
 *   to?      YYYY-MM-DD (default: from + 60 days)
 *   upcoming?  "1" (default) returns only future classes; "0" returns all in range
 *
 * Each item carries hours_until_class and a `cancellable` flag (class ≥ 8h away),
 * so the site can enable/disable the cancel button without extra logic.
 */
router.get('/client/:clientId', async (req: Request, res: Response) => {
  try {
    const clientId = String(req.params.clientId || '');
    if (!clientId) {
      res.status(400).json({ error: 'Missing clientId' });
      return;
    }

    const upcomingOnly = req.query.upcoming !== '0'; // default: upcoming only
    const fromParam = typeof req.query.from === 'string' ? req.query.from : undefined;
    const toParam = typeof req.query.to === 'string' ? req.query.to : undefined;

    const { from, to, attendances } = await listClientAttendances(clientId, {
      from: fromParam,
      to: toParam,
      upcomingOnly,
    });

    res.json({
      client_id: Number(clientId),
      from,
      to,
      upcoming_only: upcomingOnly,
      count: attendances.length,
      attendances,
    });
  } catch (error: any) {
    console.error('[Attendances By Client] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to list client attendances' });
  }
});

/**
 * GET /api/attendances/statuses
 * List all attendance statuses
 */
router.get('/statuses', async (_req: Request, res: Response) => {
  try {
    const data = await seufisioClient.get('/api/status', {
      rowsPerPage: 'all',
    });

    res.json(data);
  } catch (error: any) {
    console.error('[Statuses] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

/**
 * GET /api/attendances/:id
 * Get a single attendance record by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await seufisioClient.get(`/api/atendimento/${id}`);
    res.json(data);
  } catch (error: any) {
    console.error('[Attendance Get] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

/**
 * POST /api/attendances
 * Create a new attendance (appointment)
 *
 * Body: {
 *   cliente_id, profissional_id, data_atendimento (YYYY-MM-DD),
 *   hora_atendimento (HH:mm),
 *   // Provide EITHER tipo_atendimento_id OR source (proxy resolves the id):
 *   tipo_atendimento_id?, source? ("totalpass" | "wellhub"),
 *   sala_id? (default: 1), duracao_atendimento? (default: 50)
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      cliente_id,
      profissional_id,
      data_atendimento,
      hora_atendimento: rawHour,
      tipo_atendimento_id: rawTipoId,
      source,
      sala_id,
      duracao_atendimento,
    } = req.body;

    if (!cliente_id || !profissional_id || !data_atendimento || !rawHour) {
      res.status(400).json({
        error: 'Missing required fields: cliente_id, profissional_id, data_atendimento, hora_atendimento',
      });
      return;
    }

    // Resolve tipo_atendimento_id: explicit id wins, otherwise map from source.
    let tipo_atendimento_id = rawTipoId;
    if (!tipo_atendimento_id) {
      if (!source) {
        res.status(400).json({
          error: 'Provide either tipo_atendimento_id or source ("totalpass" | "wellhub")',
        });
        return;
      }
      try {
        tipo_atendimento_id = await resolveTipoAtendimentoId(source);
        console.log(`[Create Attendance] Resolved source "${source}" -> tipo_atendimento_id ${tipo_atendimento_id}`);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
        return;
      }
    }

    // Normalize hour to HH:mm
    const [rawH, rawM] = rawHour.split(':').map(Number);
    const hour = `${String(rawH).padStart(2, '0')}:${String(rawM || 0).padStart(2, '0')}`;
    const requestedStartTime = `${hour}:00`;

    // Validate slot availability via calendar API
    console.log(`[Create Attendance] Checking slot availability for professional ${profissional_id} at ${data_atendimento} ${hour}`);

    try {
      const slots: any[] = await seufisioClient.get('/api/slots/calendario', {
        data_inicial: `${data_atendimento}T00:00:00`,
        data_final: `${data_atendimento}T23:59:59`,
        profissional_id,
      });

      const matchingSlot = slots.find(
        (slot: any) =>
          slot.occur_date === data_atendimento &&
          slot.start_time === requestedStartTime,
      );

      if (matchingSlot && matchingSlot.total_booked >= matchingSlot.total_capacity) {
        res.status(409).json({
          error: `Slot is fully booked at ${data_atendimento} ${hour} (${matchingSlot.total_booked}/${matchingSlot.total_capacity}). Choose a different time.`,
        });
        return;
      }

      if (matchingSlot) {
        console.log(
          `[Create Attendance] Slot available: ${matchingSlot.total_booked}/${matchingSlot.total_capacity} at ${data_atendimento} ${hour}`,
        );
      }
    } catch (err: any) {
      console.warn(
        '[Create Attendance] Could not validate slot availability, proceeding anyway:',
        err?.response?.status || err?.message,
      );
    }

    // Calculate end time
    const sessionDuration = duracao_atendimento || 50;
    const [h, m] = hour.split(':').map(Number);
    const endMinutes = m + sessionDuration;
    const finalHour = `${String(h + Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    const atendimentoData: Record<string, any> = {
      cliente_id,
      profissional_id,
      data_atendimento,
      duracao_atendimento: sessionDuration,
      hora_atendimento: hour,
      hora_final_atendimento: finalHour,
      sala_id: sala_id || 1,
      tipo_atendimento_id,
      convenio_id: null,
      status_id: 1, // Aguardando Chegar
      remarcado_id: null,
      pacote_fixo_id: null,
      pacote_id: null,
      is_pacote: null,
      servico_ciclo_id: null,
      aula_experimental: false,
      created_by_user_id: 21714,
      atualizar_valor_cobranca_ciclo: false,
      confirmacao: true,
    };

    console.log(`[Create Attendance] Creating attendance for client ${cliente_id}`);
    console.log(`[Create Attendance] Payload: ${JSON.stringify(atendimentoData, null, 2)}`);

    const result = await seufisioClient.post('/api/atendimento', atendimentoData);

    console.log(`[Create Attendance] Success! Attendance ID: ${result.id}`);

    res.json({
      success: true,
      message: `Atendimento criado com sucesso para ${data_atendimento} às ${hour}`,
      atendimento: {
        id: result.id,
        data: result.data_atendimento,
        hora: result.hora_atendimento,
        horaFinal: result.hora_final_atendimento,
        profissional_id: result.profissional_id,
        tipo_atendimento_id: result.tipo_atendimento_id,
        status: result.status?.nome || 'Aguardando Chegar',
      },
    });
  } catch (error: any) {
    console.error('[Create Attendance] Error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create attendance',
      details: error?.response?.data || error.message,
    });
  }
});

/**
 * PUT /api/attendances/:id
 * Update an attendance record (e.g. change status, reschedule, etc.)
 * 
 * SeuFisio requires the FULL attendance object on PUT.
 * This endpoint automatically:
 * 1. Fetches the current full attendance from SeuFisio
 * 2. Merges the caller's changes on top
 * 3. Sends the complete merged object to SeuFisio
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Missing attendance id" });
      return;
    }

    const changes = req.body;

    if (!changes || Object.keys(changes).length === 0) {
      res.status(400).json({ error: "Request body is required" });
      return;
    }

    // Step 1: Get the current full attendance from SeuFisio
    console.log(`[Attendance Update] Fetching current attendance ${id}`);
    const currentAttendance: Record<string, any> = await seufisioClient.get(
      `/api/atendimento/${id}`,
    );

    // Step 2: Merge the caller's changes on top of the full object
    const mergedPayload = normalizeAttendanceForPut({ ...currentAttendance, ...changes });

    // Step 2.5: If hora_atendimento was changed, auto-recalculate hora_final_atendimento (+50 min)
    if (changes.hora_atendimento) {
      const parts = changes.hora_atendimento.split(":");
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const endMinutes = m + 50;
      const finalHour = `${String(h + Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      mergedPayload.hora_final_atendimento = finalHour;
      console.log(
        `[Attendance Update] Recalculated hora_final_atendimento: ${finalHour} (+50min)`,
      );
    }

    // Step 2.6: If time or date changed, validate slot availability via calendar API
    if (changes.hora_atendimento || changes.data_atendimento) {
      const targetDate =
        changes.data_atendimento || currentAttendance.data_atendimento;
      const targetHourRaw =
        changes.hora_atendimento || currentAttendance.hora_atendimento;
      const profId =
        changes.profissional_id || currentAttendance.profissional_id;

      // Normalize hour to HH:mm:00 for slot matching
      const [rawH, rawM] = targetHourRaw.split(":").map(Number);
      const targetHour = `${String(rawH).padStart(2, "0")}:${String(rawM || 0).padStart(2, "0")}`;
      const targetStartTime = `${targetHour}:00`;

      console.log(
        `[Attendance Update] Checking slot availability for professional ${profId} at ${targetDate} ${targetHour}`,
      );

      try {
        const slots: any[] = await seufisioClient.get("/api/slots/calendario", {
          data_inicial: `${targetDate}T00:00:00`,
          data_final: `${targetDate}T23:59:59`,
          profissional_id: profId,
        });

        const matchingSlot = slots.find(
          (slot: any) =>
            slot.occur_date === targetDate &&
            slot.start_time === targetStartTime,
        );

        if (!matchingSlot) {
          console.log(
            `[Attendance Update] No slot found for professional ${profId} at ${targetDate} ${targetHour}`,
          );
          res.status(409).json({
            error: `No slot available for this professional at ${targetDate} ${targetHour}. The professional does not have a configured slot at this time.`,
          });
          return;
        }

        if (matchingSlot.total_booked >= matchingSlot.total_capacity) {
          console.log(
            `[Attendance Update] Slot FULL for professional ${profId} at ${targetDate} ${targetHour}: ${matchingSlot.total_booked}/${matchingSlot.total_capacity}`,
          );
          res.status(409).json({
            error: `Slot is fully booked at ${targetDate} ${targetHour} (${matchingSlot.total_booked}/${matchingSlot.total_capacity}). Choose a different time.`,
          });
          return;
        }

        console.log(
          `[Attendance Update] Slot available: ${matchingSlot.total_booked}/${matchingSlot.total_capacity} at ${targetDate} ${targetHour}`,
        );
      } catch (err: any) {
        console.warn(
          `[Attendance Update] Could not validate slot availability, proceeding anyway:`,
          err?.response?.status || err?.message,
        );
      }
    }

    console.log(`[Attendance Update] Updating attendance ${id}`);
    console.log(`[Attendance Update] Changes: ${JSON.stringify(changes)}`);
    console.log(
      `[Attendance Update] Full payload: ${JSON.stringify(mergedPayload)}`,
    );

    // Step 3: Send the complete merged object to SeuFisio
    const data = await seufisioClient.put(
      `/api/atendimento/${id}`,
      mergedPayload,
    );

    console.log(`[Attendance Update] Success for ${id}`);
    res.json(data);
  } catch (error: any) {
    console.error('[Attendance Update] Error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to update attendance',
      details: error?.response?.data || error.message,
    });
  }
});

/**
 * POST /api/attendances/:id/cancel
 * Cancel a booking — allowed only when the class is at least
 * CANCELLATION_MIN_HOURS (default 8h) away, measured in studio local time
 * (America/Sao_Paulo, UTC-3).
 *
 * Returns 422 when inside the cutoff window.
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Missing attendance id' });
      return;
    }

    // Fetch the full attendance (also gives us the object to PUT back).
    const attendance: Record<string, any> = await seufisioClient.get(`/api/atendimento/${id}`);

    const date: string = attendance.data_atendimento; // YYYY-MM-DD
    const hour: string = attendance.hora_atendimento; // HH:mm
    const hoursUntil = hoursUntilClass(date, hour);
    if (hoursUntil === null) {
      res.status(422).json({ error: `Attendance has no valid scheduled date/time (${date} ${hour})` });
      return;
    }

    if (hoursUntil < env.CANCELLATION_MIN_HOURS) {
      res.status(422).json({
        error: `Cancellation not allowed: class starts in ${hoursUntil.toFixed(1)}h, which is less than the ${env.CANCELLATION_MIN_HOURS}h minimum.`,
        class_start: `${date} ${hour}`,
        hours_until_class: Number(hoursUntil.toFixed(2)),
        min_hours: env.CANCELLATION_MIN_HOURS,
      });
      return;
    }

    // Resolve the cancelled status and PUT the full merged object back.
    const cancelled = await resolveCancelledStatus();
    const cancelledStatusId = cancelled.id;
    const mergedPayload = normalizeAttendanceForPut({
      ...attendance,
      status_id: cancelledStatusId,
      status: cancelled.status,
    });

    console.log(`[Attendance Cancel] Cancelling ${id} (status_id ${cancelledStatusId}), class in ${hoursUntil.toFixed(1)}h`);

    const data = await seufisioClient.put(`/api/atendimento/${id}`, mergedPayload);

    res.json({
      success: true,
      message: `Atendimento ${id} cancelado com sucesso`,
      hours_until_class: Number(hoursUntil.toFixed(2)),
      status_id: cancelledStatusId,
      atendimento: data,
    });
  } catch (error: any) {
    console.error('[Attendance Cancel] Error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to cancel attendance',
      details: error?.response?.data || error.message,
    });
  }
});

export default router;
