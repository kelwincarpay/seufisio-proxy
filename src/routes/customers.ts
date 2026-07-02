import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';
import { getClientDetail } from '../services/client-attendances';

const router = Router();

/**
 * Map a full SeuFisio client detail record to the fields the booking site needs.
 */
function toCustomer(detail: any) {
  return {
    id: detail.id,
    nome: first(detail.nome, detail.nome_registro),
    cpf: first(detail.cpf, detail.documento),
    email: first(detail.email, detail.email_principal),
    telefone: first(detail.telefone, detail.telefone_2, detail.celular),
    data_nascimento: first(detail.data_nascimento, detail.nascimento) || null,
    situacao: first(detail.str_situacao) || detail.situacao,
    tipo_cliente: detail.tipo_cliente,
    // Aggregator-app tokens (null when the client is not linked to that app).
    gympass_token: detail.gympass_token ?? null,
    total_pass_token: detail.total_pass_token ?? null,
  };
}

function first(...values: any[]): string {
  for (const v of values) {
    const s = v != null ? String(v).trim() : '';
    if (s) return s;
  }
  return '';
}

/**
 * GET /api/customers?cpf=<cpf>
 * Look up a client by CPF (patient self-identification on the booking site).
 *
 * Uses SeuFisio's expanded-identifier search (busca_identificadores_ampliada).
 * The list response does not echo the CPF or contact info, so each match is
 * enriched with the full client detail (GET /api/cliente/:id) — returning cpf,
 * email, telefone, etc.
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

    const results = data.data || [];

    if (results.length === 0) {
      res.status(404).json({ error: 'No active client found for this CPF', cpf });
      return;
    }

    // The list response lacks CPF/contact info — fetch full detail for each match.
    const matches = await Promise.all(
      results.map(async (item: any) => {
        try {
          const detail = await getClientDetail(item.id);
          return toCustomer(detail);
        } catch {
          // Fall back to the list fields if the detail fetch fails.
          return toCustomer(item);
        }
      }),
    );

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
