import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

/**
 * POST /api/customers
 * Create a new customer (cliente) in SeuFisio
 *
 * Body: { nome, cpf, telefone?, email? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome, cpf, telefone, email } = req.body;

    if (!nome) {
      res.status(400).json({ error: 'Missing required field: nome' });
      return;
    }

    const payload: Record<string, any> = {
      nome,
      nome_registro: nome,
      cpf: cpf || '',
      tipo_cliente: 2,
      bairro: '',
      cidade: '',
      uf: '',
      endereco: '',
      endereco_complemento: '',
      mostrar_cadastro_completo: true,
      paga_adiantado: 1,
      situacao: 2,
      sexo: 0,
      telefone_ddi: 'BR',
      telefone_2_ddi: 'BR',
      telefone_responsavel_ddi: 'BR',
      dia_padrao_renovacao: '',
      dia_padrao_cobranca: '',
      pacote_fixo_recorrente: 0,
      mostrar_renovacao_pacote: true,
      tipo_aluno: 0,
      pacote_fixo_cobranca_automatica: 0,
      dados_cobranca: {
        forma_pagamento: 'avista',
        boleto: true,
        cartao: false,
        tipo_pessoa: 'PF',
      },
      dados_moloni: {},
      cliente_desde: new Date().toISOString(),
      verifica_duplicidades: true,
    };

    // Optional fields
    if (telefone) payload.telefone = telefone;
    if (email) payload.email = email;

    console.log(`[Create Customer] Creating customer: ${nome}`);

    const result = await seufisioClient.post('/api/cliente', payload);

    console.log(`[Create Customer] Success! Customer ID: ${result.id}`);

    res.json({
      success: true,
      customer: {
        id: result.id,
        nome: result.nome,
        cpf: result.cpf,
        created_at: result.created_at,
      },
    });
  } catch (error: any) {
    console.error('[Create Customer] Error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create customer',
      details: error?.response?.data || error.message,
    });
  }
});

export default router;
