/**
 * Contracts generated from SeuFisio templates: "Contrato Cliente Pacote" (model 1)
 * and "Termo de Consentimento" (model 2).
 *
 * Spec: docs/contratos.md
 *
 * Two things to keep in mind:
 *  - The rendered `texto` is a snapshot. A contract generated before the client
 *    completes their registration keeps the blank fields forever, so callers must
 *    check `missingRegistrationFields` first.
 *  - `aceitou` comes back as 1 on creation, signed or not. The signature check is
 *    `data_hora_assinatura`.
 */
import { seufisioClient } from './seufisio-client';
import { env } from '../config/env';

/** The Eloquent class name SeuFisio expects for a recurring plan. */
const MODULO_CLIENTE_SERVICO = 'App\\ClienteServico';

export interface GeneratedContract {
  id: number;
  nome_contrato: string;
  modelo_contrato_id: number;
  link: string;
}

export interface ContractStatus {
  id: number;
  nome_contrato: string;
  modelo_contrato_id: number;
  data_hora_abertura: string | null;
  data_hora_assinatura: string | null;
  assinado: boolean;
  /** Opened the link but never finished signing. */
  aberto_sem_assinar: boolean;
}

/**
 * Fields the two templates merge in. The client contract only uses nome + cpf, but
 * the consent term also needs estado civil, profession, birth date and the full
 * address — so the gate is the union. Confirmed against a term rendered with an
 * incomplete registration, which came out with nine blank spans.
 */
const REQUIRED_FIELDS: Array<{ key: string; label: string; alt?: string }> = [
  { key: 'nome', label: 'nome' },
  { key: 'cpf', label: 'CPF' },
  { key: 'data_nascimento', label: 'data de nascimento' },
  { key: 'profissao', label: 'profissão' },
  { key: 'estado_civil', label: 'estado civil' },
  { key: 'endereco', label: 'endereço (rua)' },
  { key: 'endereco_numero', label: 'número' },
  { key: 'cep', label: 'CEP' },
  { key: 'bairro', label: 'bairro', alt: 'bairro_id' },
  { key: 'cidade', label: 'cidade', alt: 'cidade_id' },
  { key: 'uf', label: 'UF' },
];

function filled(value: any): boolean {
  return value != null && String(value).trim() !== '';
}

/** Human labels of the registration fields still missing. Empty = ready for contracts. */
export function missingRegistrationFields(cliente: any): string[] {
  return REQUIRED_FIELDS.filter(
    (f) => !filled(cliente?.[f.key]) && !(f.alt && filled(cliente?.[f.alt])),
  ).map((f) => f.label);
}

/** Render + create one contract, then fetch its public signature link. */
export async function generateContract(
  clienteId: number | string,
  planId: number | string,
  modeloContratoId: number,
): Promise<GeneratedContract> {
  const reference = {
    modulo_id: String(planId),
    modulo: MODULO_CLIENTE_SERVICO,
    modelo_contrato_id: modeloContratoId,
  };

  const rendered = await seufisioClient.post(
    `/api/modelo-contrato/get-contrato-completo/${modeloContratoId}`,
    reference,
  );

  const created = await seufisioClient.post('/api/contrato', {
    nome_contrato: rendered?.nome_contrato,
    texto: rendered?.texto,
    ...reference,
    cliente_id: Number(clienteId),
  });

  const link = await seufisioClient.get(`/api/contrato/${created.id}/link`);

  return {
    id: created.id,
    nome_contrato: created.nome_contrato,
    modelo_contrato_id: modeloContratoId,
    link: typeof link === 'string' ? link : String(link),
  };
}

/** Both contracts for a plan, in order: client contract then consent term. */
export async function generatePlanContracts(
  clienteId: number | string,
  planId: number | string,
): Promise<GeneratedContract[]> {
  const contrato = await generateContract(clienteId, planId, env.MODELO_CONTRATO_CLIENTE_ID);
  const termo = await generateContract(clienteId, planId, env.MODELO_CONTRATO_TERMO_ID);
  return [contrato, termo];
}

/**
 * Signature state of a client's contracts, optionally narrowed to one plan.
 * `aceitou` is deliberately ignored: it is 1 from the moment of creation.
 */
export async function listContractStatus(
  clienteId: number | string,
  planId?: number | string,
): Promise<ContractStatus[]> {
  const report = await seufisioClient.get('/api/relatorio/contrato', {
    page: 1,
    rowsPerPage: 100,
    descending: false,
    filtro_where_data: 'criacao',
    filtro_situacao: 'ambos',
    filtro_aceitou: 'ambos',
    filtro_vigente: 'ambos',
    filtro_cliente_id: clienteId,
  });

  const rows: any[] = report?.data || [];
  return rows
    .filter((r) => planId == null || String(r.modulo_id) === String(planId))
    .map((r) => ({
      id: r.id,
      nome_contrato: r.nome_contrato,
      modelo_contrato_id: r.modelo_contrato_id,
      data_hora_abertura: r.data_hora_abertura ?? null,
      data_hora_assinatura: r.data_hora_assinatura ?? null,
      assinado: filled(r.data_hora_assinatura),
      aberto_sem_assinar: filled(r.data_hora_abertura) && !filled(r.data_hora_assinatura),
    }));
}

export async function getContractLink(contratoId: number | string): Promise<string> {
  const link = await seufisioClient.get(`/api/contrato/${contratoId}/link`);
  return typeof link === 'string' ? link : String(link);
}

/** The public link the client uses to complete their own registration. */
export async function getRegistrationLink(clienteId: number | string): Promise<string> {
  const link = await seufisioClient.get(`/api/cliente/${clienteId}/link-cadastro-cliente`);
  return typeof link === 'string' ? link : String(link);
}
