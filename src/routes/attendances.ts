import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

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
    const mergedPayload = { ...currentAttendance, ...changes };

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

export default router;
