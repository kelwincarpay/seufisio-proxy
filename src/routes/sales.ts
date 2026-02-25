import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

/**
 * GET /api/clients/:clientId/sales
 * List active sales for a client
 */
router.get('/:clientId/sales', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;

    const data = await seufisioClient.get(`/api/cliente/${clientId}/listar-vendas`, {
      tab: 'ativas',
      page: 1,
      per_page: 100,
    });

    const sales = (data.data || []).map((sale: any) => ({
      id: sale.id,
      tipoVenda: sale.tipoVenda,
      tipoAtendimentoNome: sale.tipoAtendimentoNome,
      tipoAtendimentoId: sale.tipoAtendimentoId,
      dataInicial: sale.dataInicial,
      validade: sale.validade,
      atendimentosFeitos: sale.atendimentosFeitos,
      atendimentosContratados: sale.atendimentosContratados,
      atendimentosRepor: sale.atendimentosRepor,
      informacoes: sale.informacoes,
    }));

    res.json({ sales, meta: data.meta });
  } catch (error: any) {
    console.error('[Sales] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

export default router;
