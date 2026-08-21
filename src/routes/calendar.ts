import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';
import { getSlotsForDate } from '../services/calendar';

const router = Router();

/**
 * GET /api/calendar?date=<YYYY-MM-DD>&profissional_id=<id?>
 * Get calendar slot availability for a date.
 * If profissional_id is omitted, queries all active professionals.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { date, profissional_id } = req.query;

    if (!date) {
      res.status(400).json({
        error: 'Missing required query parameter: date (YYYY-MM-DD)',
      });
      return;
    }

    const dateStr = date as string;
    const slots = await getSlotsForDate(
      dateStr,
      profissional_id ? parseInt(profissional_id as string, 10) : null,
    );

    res.json({ date: dateStr, slots });
  } catch (error: any) {
    console.error('[Calendar] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

/**
 * PUT /api/calendar/slots/:slotId
 * Update a slot's capacity
 *
 * Body: { grupo_id, total_capacity }
 */
router.put('/slots/:slotId', async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    const { grupo_id, total_capacity } = req.body;

    if (!grupo_id || total_capacity === undefined) {
      res.status(400).json({
        error: 'Missing required fields: grupo_id, total_capacity',
      });
      return;
    }

    console.log(`[Calendar] Updating slot ${slotId} (group ${grupo_id}) capacity to ${total_capacity}`);

    const result = await seufisioClient.put(
      `/api/grupo/${grupo_id}/slot/${slotId}/atualizar-capacidade`,
      {
        totalCapacity: total_capacity,
        totalBooked: null,
      },
    );

    console.log(`[Calendar] Slot ${slotId} updated successfully`);

    res.json({
      success: true,
      slot: {
        id: result.id,
        grupo_id: result.grupoId,
        occur_date: result.occurDate,
        start_time: result.startTime,
        total_capacity: result.totalCapacity,
        total_booked: result.totalBooked,
      },
    });
  } catch (error: any) {
    console.error('[Calendar Update Slot] Error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to update slot capacity',
      details: error?.response?.data || error.message,
    });
  }
});

export default router;
