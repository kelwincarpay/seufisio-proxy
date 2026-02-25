import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

/**
 * GET /api/clients?search=<name>
 * Search clients by name
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';

    const data = await seufisioClient.get('/api/cliente', {
      page: 1,
      filter: search,
      'filtro_avancado[buscar]': search,
      'filtro_avancado[situacao]': 2, // Active clients only
      'filtro_avancado[telefone]': '',
      'filtro_avancado[tipo_cliente]': '',
      'filtro_avancado[pacote_ativo]': '',
    });

    // Simplify response for OpenClaw
    const clients = (data.data || []).map((client: any) => ({
      id: client.id,
      nome: client.nome,
      situacao: client.str_situacao,
      tipo_cliente: client.tipo_cliente,
    }));

    res.json({
      clients,
      pagination: {
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      },
    });
  } catch (error: any) {
    console.error('[Clients] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

export default router;
