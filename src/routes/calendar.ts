import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

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

    // If a specific professional is requested, fetch just that one
    if (profissional_id) {
      const slots = await fetchSlotsForProfessional(
        parseInt(profissional_id as string),
        null,
        dateStr,
      );
      res.json({ date: dateStr, slots });
      return;
    }

    // Otherwise, fetch slots for ALL active professionals
    const professionals: any[] = await seufisioClient.get(
      '/api/profissional/todos-profissionais',
    );
    const activeProfessionals = professionals.filter((p: any) => p.ativo);

    const allSlots: any[] = [];

    for (const prof of activeProfessionals) {
      const profSlots = await fetchSlotsForProfessional(
        prof.id,
        prof.nome,
        dateStr,
      );
      allSlots.push(...profSlots);
    }

    res.json({ date: dateStr, slots: allSlots });
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

async function fetchSlotsForProfessional(
  profId: number,
  profName: string | null,
  date: string,
): Promise<any[]> {
  try {
    const slots: any[] = await seufisioClient.get('/api/slots/calendario', {
      data_inicial: `${date}T00:00:00`,
      data_final: `${date}T23:59:59`,
      profissional_id: profId,
    });

    return (slots || []).map((slot: any) => ({
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
    }));
  } catch (err: any) {
    console.error(
      `[Calendar] Failed to fetch slots for professional ${profId}:`,
      err?.response?.status || err?.message,
    );
    return [];
  }
}

export default router;
