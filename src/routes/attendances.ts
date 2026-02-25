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

    // Step 2.5: If hora_atendimento was changed, auto-recalculate hora_final_atendimento
    if (changes.hora_atendimento) {
      const periodoAtendimento =
        currentAttendance.tipo?.periodo_atendimento ||
        currentAttendance.duracao_atendimento ||
        50;
      const hourStr = changes.hora_atendimento.replace(/:00$/, ""); // strip trailing :00 if "HH:mm:00"
      const [h, m] = hourStr.split(":").map(Number);
      const endMinutes = m + periodoAtendimento;
      const finalHour = `${String(h + Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      mergedPayload.hora_final_atendimento = finalHour;
      console.log(
        `[Attendance Update] Recalculated hora_final_atendimento: ${finalHour} (periodo: ${periodoAtendimento}min)`,
      );
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
