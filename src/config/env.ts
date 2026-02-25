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
};
