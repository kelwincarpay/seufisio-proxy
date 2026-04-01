import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

interface UpdateScheduleBody {
  data_inicio_alteracao: string;
  domingo?: boolean;
  segunda?: boolean;
  terca?: boolean;
  quarta?: boolean;
  quinta?: boolean;
  sexta?: boolean;
  sabado?: boolean;
  sala_id_domingo?: number | null;
  sala_id_segunda?: number | null;
  sala_id_terca?: number | null;
  sala_id_quarta?: number | null;
  sala_id_quinta?: number | null;
  sala_id_sexta?: number | null;
  sala_id_sabado?: number | null;
  profissional_id_domingo?: number | null;
  profissional_id_segunda?: number | null;
  profissional_id_terca?: number | null;
  profissional_id_quarta?: number | null;
  profissional_id_quinta?: number | null;
  profissional_id_sexta?: number | null;
  profissional_id_sabado?: number | null;
  hora_domingo?: string;
  hora_segunda?: string;
  hora_terca?: string;
  hora_quarta?: string;
  hora_quinta?: string;
  hora_sexta?: string;
  hora_sabado?: string;
}

/**
 * PUT /api/plans/:planId/schedule
 * Update the schedule (days, hours, rooms, and professionals) for a plan (pacote).
 *
 * Body: UpdateScheduleBody
 */
router.put('/:planId/schedule', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const body: UpdateScheduleBody = req.body;

    if (!body.data_inicio_alteracao) {
      res.status(400).json({
        error: 'Missing required field: data_inicio_alteracao (YYYY-MM-DD)',
      });
      return;
    }

    // Build the payload matching SeuFisio's expected format
    const payload = {
      data_inicio_alteracao: body.data_inicio_alteracao,
      domingo: body.domingo ?? false,
      segunda: body.segunda ?? false,
      terca: body.terca ?? false,
      quarta: body.quarta ?? false,
      quinta: body.quinta ?? false,
      sexta: body.sexta ?? false,
      sabado: body.sabado ?? false,
      sala_id_domingo: body.sala_id_domingo ?? null,
      sala_id_segunda: body.sala_id_segunda ?? null,
      sala_id_terca: body.sala_id_terca ?? null,
      sala_id_quarta: body.sala_id_quarta ?? null,
      sala_id_quinta: body.sala_id_quinta ?? null,
      sala_id_sexta: body.sala_id_sexta ?? null,
      sala_id_sabado: body.sala_id_sabado ?? null,
      profissional_id_domingo: body.profissional_id_domingo ?? null,
      profissional_id_segunda: body.profissional_id_segunda ?? null,
      profissional_id_terca: body.profissional_id_terca ?? null,
      profissional_id_quarta: body.profissional_id_quarta ?? null,
      profissional_id_quinta: body.profissional_id_quinta ?? null,
      profissional_id_sexta: body.profissional_id_sexta ?? null,
      profissional_id_sabado: body.profissional_id_sabado ?? null,
      hora_domingo: body.hora_domingo ?? '',
      hora_segunda: body.hora_segunda ?? '',
      hora_terca: body.hora_terca ?? '',
      hora_quarta: body.hora_quarta ?? '',
      hora_quinta: body.hora_quinta ?? '',
      hora_sexta: body.hora_sexta ?? '',
      hora_sabado: body.hora_sabado ?? '',
    };

    console.log(`[Plans] Updating schedule for plan ${planId}`, JSON.stringify(payload));

    const result = await seufisioClient.put(
      `/api/pacote/${planId}/atualizar-horarios`,
      payload,
    );

    console.log(`[Plans] Schedule updated successfully for plan ${planId}`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Plans] Error updating schedule:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to update plan schedule',
      details: error?.response?.data || error.message,
    });
  }
});

export default router;
