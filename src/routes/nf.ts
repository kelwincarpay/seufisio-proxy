import { Router, Request, Response } from 'express';
import { seufisioClient } from '../services/seufisio-client';

const router = Router();

const STREET_TYPE_PREFIXES = ['RODOVIA', 'ALAMEDA', 'TRAVESSA', 'ESTRADA', 'PRAÇA', 'LARGO', 'RUA', 'AV', 'VIA'];

interface NormalizedClient {
  id: string;
  name: string;
  email: string;
  document: string;
  personType: 'PF' | 'PJ' | 'UNKNOWN';
  phone: string;
  municipalRegistration: string;
  streetType: string;
  addressLine1: string;
  addressStreetName: string;
  addressNumber: string;
  addressComplement: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
}

interface ValidationIssue {
  field: string;
  label: string;
}

interface ClientValidation {
  isValid: boolean;
  issues: ValidationIssue[];
}

function first(...values: (string | number | undefined | null)[]): string {
  for (const v of values) {
    const s = v != null ? String(v).trim() : '';
    if (s) return s;
  }
  return '';
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function extractStreetType(addressLine1: string): string {
  const upper = addressLine1.toUpperCase();
  for (const prefix of STREET_TYPE_PREFIXES) {
    if (upper.startsWith(prefix + ' ') || upper === prefix) return prefix;
  }
  return '';
}

function extractStreetName(addressLine1: string, streetType: string): string {
  if (!streetType) return addressLine1;
  if (addressLine1.toUpperCase().startsWith(streetType)) {
    return addressLine1.substring(streetType.length).trim();
  }
  return addressLine1;
}

function normalizeClient(raw: any): NormalizedClient {
  const base = raw.dados_cobranca ? { ...raw.dados_cobranca, ...raw } : raw;

  const cnpjRaw = first(base.cnpj);
  const cpfRaw = first(base.cpf, base.documento);
  const cnpj = cnpjRaw ? digitsOnly(cnpjRaw) : '';
  const cpf = cpfRaw ? digitsOnly(cpfRaw) : '';
  const document = cnpj || cpf;

  let personType: 'PF' | 'PJ' | 'UNKNOWN' = 'UNKNOWN';
  if (cnpj || base.tipo_pessoa === 'PJ') {
    personType = 'PJ';
  } else if (cpf || base.tipo_pessoa === 'PF') {
    personType = 'PF';
  }

  const addressLine1 = first(base.endereco, base.logradouro, base.rua, base.street);
  const streetTypeRaw = first(base.tipo_logradouro);
  const streetType = streetTypeRaw || extractStreetType(addressLine1);
  const addressStreetName = extractStreetName(addressLine1, streetType);
  const zipCodeRaw = first(base.cep, base.zipcode, base.zip_code, base.codigo_postal);

  return {
    id: first(base.id, base.cliente_id, base.codigo, base.uuid),
    name: first(base.nome, base.nome_registro, base.razao_social, base.nome_fantasia),
    email: first(base.email, base.mail, base.email_principal),
    document,
    personType,
    phone: first(base.telefone, base.telefone_2, base.telefone_responsavel, base.celular),
    municipalRegistration: first(base.inscricao_municipal, base.inscricaoMunicipal),
    streetType,
    addressLine1,
    addressStreetName,
    addressNumber: first(base.endereco_numero, base.numero, base.number),
    addressComplement: first(base.endereco_complemento, base.complemento),
    district: first(base.bairro, base.bairro_nome),
    city: first(base.cidade, base.city, base.cidade_nome),
    state: first(base.uf, base.estado, base.state),
    zipCode: zipCodeRaw ? digitsOnly(zipCodeRaw) : '',
  };
}

function validateCpf(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return parseInt(cpf[9]) === d1 && parseInt(cpf[10]) === d2;
}

function validateCnpj(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = w1.reduce((acc, w, i) => acc + parseInt(cnpj[i]) * w, 0);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  sum = w2.reduce((acc, w, i) => acc + parseInt(cnpj[i]) * w, 0);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return parseInt(cnpj[12]) === d1 && parseInt(cnpj[13]) === d2;
}

function validateClient(client: NormalizedClient): ClientValidation {
  const issues: ValidationIssue[] = [];

  if (!client.name) issues.push({ field: 'name', label: 'nome / razão social' });

  if (!client.document) {
    issues.push({ field: 'document', label: 'CPF/CNPJ' });
  } else if (client.document.length === 11 && !validateCpf(client.document)) {
    issues.push({ field: 'document', label: 'CPF inválido' });
  } else if (client.document.length === 14 && !validateCnpj(client.document)) {
    issues.push({ field: 'document', label: 'CNPJ inválido' });
  }

  if (!client.addressLine1) issues.push({ field: 'addressLine1', label: 'logradouro' });
  if (!client.addressNumber) issues.push({ field: 'addressNumber', label: 'número' });
  if (!client.district) issues.push({ field: 'district', label: 'bairro' });
  if (!client.city) issues.push({ field: 'city', label: 'cidade' });
  if (!client.state) issues.push({ field: 'state', label: 'UF' });
  if (!client.zipCode) issues.push({ field: 'zipCode', label: 'CEP' });

  return { isValid: issues.length === 0, issues };
}

function pickResultArray(data: any): any[] {
  for (const key of ['data', 'items', 'results', 'clientes', 'contas']) {
    if (Array.isArray(data[key])) return data[key];
  }
  return Array.isArray(data) ? data : [];
}

/**
 * GET /api/seufisio/client/search?q=<name_or_cpf>
 * Search SeuFisio clients and return normalized NF-ready data.
 */
router.get('/client/search', async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q) {
      res.status(400).json({ error: 'Parâmetro q é obrigatório.' });
      return;
    }

    const searchData = await seufisioClient.get('/api/cliente', {
      page: 1,
      filter: q,
      'filtro_avancado[busca_identificadores_ampliada]': true,
      'filtro_avancado[situacao]': 2,
      'filtro_avancado[telefone]': '',
      'filtro_avancado[tipo_cliente]': '',
      'filtro_avancado[pacote_ativo]': '',
    });

    const results = pickResultArray(searchData);

    const normalized = await Promise.all(
      results.map(async (item: any) => {
        try {
          const detail = await seufisioClient.get(`/api/cliente/${item.id}`);
          const client = normalizeClient(detail);
          return { client, validation: validateClient(client) };
        } catch {
          const client = normalizeClient(item);
          return { client, validation: validateClient(client) };
        }
      }),
    );

    res.json({ data: normalized });
  } catch (error: any) {
    console.error('[NF] Client search error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
});

/**
 * GET /api/seufisio/client/:id
 * Get full normalized NF-ready data for a single SeuFisio client.
 */
router.get('/client/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const detail = await seufisioClient.get(`/api/cliente/${id}`);
    const client = normalizeClient(detail);
    res.json({ data: { client, validation: validateClient(client) } });
  } catch (error: any) {
    if (error?.response?.status === 404) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }
    console.error('[NF] Client detail error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar cliente.' });
  }
});

export default router;
