import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  SEUFISIO_USER: string;
  SEUFISIO_PASSWORD: string;
  SEUFISIO_CLIENT_SECRET: string;
  SEUFISIO_CLINIC_ID: string;
  API_SECRET_TOKEN: string;
  MAX_ATTENDANCES_PER_HOUR: number;
  PORT: number;
  // Aggregator app → tipo_atendimento_id mapping (proxy resolves source server-side).
  // Optional: if unset, the source is resolved by matching the tipo_atendimento name.
  TIPO_TOTALPASS_ID: number | null;
  TIPO_WELLHUB_ID: number | null;
  // Minimum hours before a class start that a booking can still be cancelled.
  CANCELLATION_MIN_HOURS: number;
  // status_id used to mark an attendance cancelled. Optional: if unset it is
  // resolved by matching the status name (contains "cancel").
  CANCELLED_STATUS_ID: number | null;
  // Supabase (WhatsApp reminder preferences persistence). Optional: when unset,
  // the notifications routes and reminder cron stay disabled.
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // Evolution API (WhatsApp sender). Optional: required only to actually send.
  EVOLUTION_API_URL: string;
  EVOLUTION_API_KEY: string;
  EVOLUTION_INSTANCE: string;
  // Reminder cron schedule + how many days ahead to scan for classes.
  NOTIFICATIONS_CRON: string;
  NOTIFY_LOOKAHEAD_DAYS: number;
  // Post-sale onboarding sweep: registration link → contracts → signatures.
  ONBOARDING_CRON: string;
  ONBOARDING_RESEND_HOURS: number;
  // Contract templates (GET /api/modelo-contrato/options).
  MODELO_CONTRATO_CLIENTE_ID: number;
  MODELO_CONTRATO_TERMO_ID: number;
}

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const env: EnvConfig = {
  SEUFISIO_USER: getEnvVar('SEUFISIO_USER'),
  SEUFISIO_PASSWORD: getEnvVar('SEUFISIO_PASSWORD'),
  SEUFISIO_CLIENT_SECRET: getEnvVar('SEUFISIO_CLIENT_SECRET'),
  SEUFISIO_CLINIC_ID: getEnvVar('SEUFISIO_CLINIC_ID', false) || '9208',
  API_SECRET_TOKEN: getEnvVar('API_SECRET_TOKEN'),
  MAX_ATTENDANCES_PER_HOUR: parseInt(process.env.MAX_ATTENDANCES_PER_HOUR || '4', 10),
  PORT: parseInt(process.env.PORT || '3000', 10),
  TIPO_TOTALPASS_ID: process.env.TIPO_TOTALPASS_ID ? parseInt(process.env.TIPO_TOTALPASS_ID, 10) : null,
  TIPO_WELLHUB_ID: process.env.TIPO_WELLHUB_ID ? parseInt(process.env.TIPO_WELLHUB_ID, 10) : null,
  CANCELLATION_MIN_HOURS: parseInt(process.env.CANCELLATION_MIN_HOURS || '8', 10),
  CANCELLED_STATUS_ID: process.env.CANCELLED_STATUS_ID ? parseInt(process.env.CANCELLED_STATUS_ID, 10) : null,
  SUPABASE_URL: getEnvVar('SUPABASE_URL', false),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', false),
  EVOLUTION_API_URL: getEnvVar('EVOLUTION_API_URL', false),
  EVOLUTION_API_KEY: getEnvVar('EVOLUTION_API_KEY', false),
  EVOLUTION_INSTANCE: getEnvVar('EVOLUTION_INSTANCE', false),
  NOTIFICATIONS_CRON: getEnvVar('NOTIFICATIONS_CRON', false) || '*/15 * * * *',
  NOTIFY_LOOKAHEAD_DAYS: parseInt(process.env.NOTIFY_LOOKAHEAD_DAYS || '2', 10),
  ONBOARDING_CRON: getEnvVar('ONBOARDING_CRON', false) || '*/10 * * * *',
  ONBOARDING_RESEND_HOURS: parseInt(process.env.ONBOARDING_RESEND_HOURS || '48', 10),
  MODELO_CONTRATO_CLIENTE_ID: parseInt(process.env.MODELO_CONTRATO_CLIENTE_ID || '1', 10),
  MODELO_CONTRATO_TERMO_ID: parseInt(process.env.MODELO_CONTRATO_TERMO_ID || '2', 10),
};
