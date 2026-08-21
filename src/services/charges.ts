/**
 * Charge (conta a receber) helpers.
 *
 * Spec: docs/desconto-primeira-cobranca.md
 */
import { seufisioClient } from './seufisio-client';

const BRL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "R$ 1.200,00" */
export function formatBRL(value: number): string {
  return `R$ ${BRL.format(value)}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The note SeuFisio's own UI writes into `descricao`. The `\n` is literal — two
 * characters, backslash and n — which is what the app sends; not a real newline.
 */
export function discountNote(original: number, desconto: number, novo: number): string {
  const percent = original ? (desconto / original) * 100 : 0;
  const pct = percent.toFixed(2).replace('.', ',');
  return `Valor Original: ${formatBRL(original)}\\nAplic. Desc. de ${formatBRL(desconto)}(${pct}%), ${formatBRL(novo)}.`;
}

export interface DiscountResult {
  charge: any;
  valor_original: number;
  valor_desconto: number;
  valor_final: number;
  descricao: string;
}

/**
 * Apply a discount to an existing charge. The PUT wants the whole object echoed
 * back (all ~71 fields including the nested `cliente`), with only the value, the
 * note and three flags changed. The server recalculates `valor_bruto`.
 */
export async function applyDiscount(
  chargeId: number | string,
  valorDesconto: number,
  options: { descricao?: string } = {},
): Promise<DiscountResult> {
  const charge = await seufisioClient.get(`/api/conta-receber/${chargeId}`);

  const original = Number(charge?.valor);
  if (!isFinite(original)) {
    throw new Error(`Charge ${chargeId} has no readable "valor"`);
  }

  const desconto = round2(Number(valorDesconto));
  if (!(desconto > 0)) {
    throw new Error('Discount must be greater than zero');
  }
  if (desconto > original) {
    throw new Error(
      `Discount ${formatBRL(desconto)} exceeds the charge value ${formatBRL(original)}`,
    );
  }

  const novo = round2(original - desconto);
  const descricao = options.descricao || discountNote(original, desconto, novo);

  const updated = await seufisioClient.put(`/api/conta-receber/${chargeId}`, {
    ...charge,
    valor: novo,
    descricao,
    descontar: true,
    parcelar: false,
    parcelas: [],
  });

  return {
    charge: updated,
    valor_original: original,
    valor_desconto: desconto,
    valor_final: novo,
    descricao,
  };
}
