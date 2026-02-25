import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

/**
 * GET /api/professionals
 * List all professionals
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await seufisioClient.get('/api/profissional/todos-profissionais');

    const professionals = (data || []).map((prof: any) => ({
      id: prof.id,
      nome: prof.nome,
      ativo: prof.ativo,
    }));

    res.json({ professionals });
  } catch (error: any) {
    console.error('[Professionals] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch professionals' });
  }
});

export default router;
