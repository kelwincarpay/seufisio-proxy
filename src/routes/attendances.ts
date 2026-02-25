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
 * PUT /api/attendances/:id
 * Update an attendance record (e.g. change status, reschedule, etc.)
 * Passes the full body through to SeuFisio
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Missing attendance id' });
      return;
    }

    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
      res.status(400).json({ error: 'Request body is required' });
      return;
    }

    console.log(`[Attendance Update] Updating attendance ${id}`);
    console.log(
      `[Attendance Update] Payload: ${JSON.stringify(body, null, 2)}`,
    );

    const data = await seufisioClient.put(`/api/atendimento/${id}`, body);

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

