import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';
import { studioToday } from '../services/client-attendances';
import { applyDiscount } from '../services/charges';

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

/**
 * POST /api/charges/:id/discount
 * Apply a discount to an existing charge — used when the client already paid
 * something before closing the plan (a R$ 50 avaliação, for example) and that
 * credit comes off the first generated charge.
 *
 * Body: { valor_desconto, descricao? }
 *
 * The value drops and the discount is recorded in `descricao` (the only free-text
 * field on a charge). Spec: docs/desconto-primeira-cobranca.md
 */
router.post('/:id/discount', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { valor_desconto, descricao } = req.body || {};

    if (valor_desconto == null || !isFinite(Number(valor_desconto))) {
      res.status(400).json({ error: 'Missing or invalid required field: valor_desconto' });
      return;
    }

    console.log(`[Charge Discount] Applying ${valor_desconto} to charge ${id}`);

    const result = await applyDiscount(id, Number(valor_desconto), { descricao });

    res.json({
      success: true,
      charge: {
        id: result.charge?.id,
        titulo: result.charge?.titulo,
        valor: result.charge?.valor,
        valor_bruto: result.charge?.valor_bruto,
        descricao: result.charge?.descricao,
        data_vencimento: result.charge?.data_vencimento,
        pago: result.charge?.pago,
      },
      valor_original: result.valor_original,
      valor_desconto: result.valor_desconto,
      valor_final: result.valor_final,
    });
  } catch (error: any) {
    const details = error?.response?.data || error.message;
    console.error('[Charge Discount] Error:', details);
    // Validation problems (zero/over-value discount) are the caller's fault.
    const status = /Discount|valor/.test(String(error?.message)) && !error?.response ? 400 : 500;
    res.status(status).json({ error: 'Failed to apply discount', details });
  }
});

export default router;
