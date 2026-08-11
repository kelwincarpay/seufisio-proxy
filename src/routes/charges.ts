import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';
import { studioToday } from '../services/client-attendances';

const router = Router();

// SeuFisio payment method used when a charge is created already paid.
const DEFAULT_FORMA_PAGAMENTO_ID = 7;

/**
 * POST /api/charges
 * Create a charge (conta a receber) in SeuFisio
 *
 * Body: {
 *   cliente_id, atendimento_id, valor, data_vencimento,
 *   profissional_id, titulo?, pago?, produtos_servicos_vinculados?,
 *   centro_custo_id?, data_pagamento?, forma_pagamento_id?
 * }
 *
 * When `pago` is truthy the charge is created already settled: SeuFisio also
 * requires `data_pagamento` (defaults to today, studio local time) and
 * `forma_pagamento_id` (defaults to 7).
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
      data_pagamento,
      forma_pagamento_id,
    } = req.body;

    if (!cliente_id || !atendimento_id || !valor || !data_vencimento || !profissional_id) {
      res.status(400).json({
        error: 'Missing required fields: cliente_id, atendimento_id, valor, data_vencimento, profissional_id',
      });
      return;
    }

    // Accept true / 1 / "1" as paid.
    const isPaid = pago === true || Number(pago) === 1;

    const payload: Record<string, any> = {
      parcelar: false,
      pago: isPaid ? 1 : 0,
      cliente_id,
      titulo: titulo || `Atendimento NR: ${atendimento_id}`,
      data_vencimento,
      profissional_id,
      atendimento_id,
      valor,
      centro_custo_id: centro_custo_id || 1,
      produtos_servicos_vinculados: produtos_servicos_vinculados || '',
    };

    if (isPaid) {
      payload.data_pagamento = data_pagamento || studioToday();
      payload.forma_pagamento_id = forma_pagamento_id || DEFAULT_FORMA_PAGAMENTO_ID;
    }

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
        data_pagamento: result.data_pagamento ?? null,
        forma_pagamento_id: result.forma_pagamento_id ?? null,
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
