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
};
