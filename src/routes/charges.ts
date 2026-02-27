import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

/**
 * POST /api/charges
 * Create a charge (conta a receber) in SeuFisio
 *
 * Body: {
 *   cliente_id, atendimento_id, valor, data_vencimento,
 *   profissional_id, titulo?, pago?, produtos_servicos_vinculados?,
 *   centro_custo_id?
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      cliente_id,
      atendimento_id,
      valor,
      data_vencimento,
      profissional_id,
      titulo,
      pago,
      produtos_servicos_vinculados,
      centro_custo_id,
    } = req.body;

    if (!cliente_id || !atendimento_id || !valor || !data_vencimento || !profissional_id) {
      res.status(400).json({
        error: 'Missing required fields: cliente_id, atendimento_id, valor, data_vencimento, profissional_id',
      });
      return;
    }

    const payload = {
      parcelar: false,
      pago: pago ?? 0,
      cliente_id,
      titulo: titulo || `Atendimento NR: ${atendimento_id}`,
      data_vencimento,
      profissional_id,
      atendimento_id,
      valor,
      centro_custo_id: centro_custo_id || 1,
      produtos_servicos_vinculados: produtos_servicos_vinculados || '',
    };

    console.log(`[Create Charge] Creating charge for client ${cliente_id}, attendance ${atendimento_id}`);
    console.log(`[Create Charge] Payload: ${JSON.stringify(payload)}`);

    const result = await seufisioClient.post('/api/conta-receber', payload);

    console.log(`[Create Charge] Success! Charge ID: ${result.id}`);

    res.json({
      success: true,
      charge: {
        id: result.id,
        titulo: result.titulo,
        valor: result.valor,
        data_vencimento: result.data_vencimento,
        pago: result.pago,
        cliente_id: result.cliente_id,
        atendimento_id: result.atendimento_id,
      },
    });
  } catch (error: any) {
    console.error('[Create Charge] Error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create charge',
      details: error?.response?.data || error.message,
    });
  }
});

export default router;
