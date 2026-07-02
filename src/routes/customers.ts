import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

/**
 * GET /api/customers?cpf=<cpf>
 * Look up a client by CPF (patient self-identification on the booking site).
 *
 * Uses SeuFisio's expanded-identifier search (busca_identificadores_ampliada).
 * The list response does not echo the CPF back, but filtering by it confirms
 * identity and returns the client id needed for booking.
 *
 * Responds 404 when no active client matches the CPF, so the site can then
 * offer registration via POST /api/customers.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const cpf = (req.query.cpf as string || '').trim();

    if (!cpf) {
      res.status(400).json({ error: 'Missing required query parameter: cpf' });
      return;
    }

    const data = await seufisioClient.get('/api/cliente', {
      page: 1,
      'filtro_avancado[busca_identificadores_ampliada]': true,
      'filtro_avancado[situacao]': 2, // Active clients only
      'filtro_avancado[cpf]': cpf,
      'filtro_avancado[telefone]': '',
      'filtro_avancado[tipo_cliente]': '',
      'filtro_avancado[pacote_ativo]': '',
    });

    const matches = (data.data || []).map((client: any) => ({
      id: client.id,
      nome: client.nome,
      situacao: client.str_situacao,
      tipo_cliente: client.tipo_cliente,
    }));

    if (matches.length === 0) {
      res.status(404).json({ error: 'No active client found for this CPF', cpf });
      return;
    }

    // Return the first match as the resolved client, plus any others for disambiguation.
    res.json({ client: matches[0], matches });
  } catch (error: any) {
    console.error('[Customer Lookup] Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to look up customer by CPF' });
  }
});

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
