import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

/**
 * GET /api/attendance-types
 * List all attendance types (tipo de atendimento)
 * Optionally filter by active only with ?active=true (default: only active)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active !== 'false';

    const data: any[] = await seufisioClient.get('/api/tipo-atendimento', {
      rowsPerPage: 'all',
    });

    let types = (data || []).map((type: any) => ({
      id: type.id,
      nome: type.nome,
      valor_mensal: type.valor_mensal,
      periodo_atendimento: type.periodo_atendimento,
      centro_custo_id: type.centro_custo_id,
      ativo: type.ativo,
    }));

    if (activeOnly) {
      types = types.filter((t: any) => t.ativo);
    }

    res.json({ types });
  } catch (error: any) {
    console.error('[Attendance Types] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch attendance types' });
  }
});

export default router;
