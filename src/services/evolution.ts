import axios from 'axios';
import { env } from '../config/env';

/**
 * Evolution API WhatsApp sender.
 *
 * Uses the Evolution v2 shape: POST {EVOLUTION_API_URL}/message/sendText/{instance}
 * with header `apikey` and body { number, text }. If the configured instance runs
 * Evolution v1, adjust the body to { number, textMessage: { text } }.
 */
export function isEvolutionConfigured(): boolean {
  return Boolean(env.EVOLUTION_API_URL && env.EVOLUTION_API_KEY && env.EVOLUTION_INSTANCE);
}

/**
 * Normalize a Brazilian phone to digits with the 55 country code (no punctuation).
 * Returns '' if there are not enough digits to be a valid number.
 */
export function normalizePhone(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  // Strip a leading 0 (trunk prefix) if present.
  digits = digits.replace(/^0+/, '');
  // Add BR country code if it looks like a local number (10-11 digits: DDD + number).
  if (digits.length <= 11) digits = `55${digits}`;
  return digits.length >= 12 ? digits : '';
}

export interface SendResult {
  ok: boolean;
  status: number;
  data: any;
}

export async function sendText(phone: string, message: string): Promise<SendResult> {
  if (!isEvolutionConfigured()) {
    throw new Error('Evolution API is not configured (EVOLUTION_API_URL/KEY/INSTANCE)');
  }

  const number = normalizePhone(phone);
  if (!number) {
    throw new Error(`Invalid phone number: "${phone}"`);
  }

  const url = `${env.EVOLUTION_API_URL.replace(/\/$/, '')}/message/sendText/${env.EVOLUTION_INSTANCE}`;

  try {
    const res = await axios.post(
      url,
      { number, text: message },
      { headers: { apikey: env.EVOLUTION_API_KEY, 'content-type': 'application/json' } },
    );
    return { ok: true, status: res.status, data: res.data };
  } catch (error: any) {
    const status = error?.response?.status || 0;
    const data = error?.response?.data || error.message;
    console.error('[Evolution] sendText error:', status, JSON.stringify(data));
    return { ok: false, status, data };
  }
}
