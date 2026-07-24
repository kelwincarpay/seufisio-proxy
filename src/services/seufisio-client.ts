import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '../config/env';
import { getAccessToken, clearTokenCache } from './seufisio-auth';

const SEUFISIO_API_URL = 'https://api.seufisio.com.br';

function createAxiosInstance(): AxiosInstance {
  return axios.create({
    baseURL: SEUFISIO_API_URL,
    headers: {
      'accept': 'application/json, text/plain, */*',
      'acesso': 'web-desktop',
      'origin': 'https://app.seufisio.com.br',
      'referer': 'https://app.seufisio.com.br/',
      'x-requested-with': 'XMLHttpRequest',
      'x-version-app': '34',
      'setfisio': env.SEUFISIO_CLINIC_ID,
    },
  });
}

const client = createAxiosInstance();

async function makeRequest<T>(config: AxiosRequestConfig, retried = false): Promise<T> {
  const token = await getAccessToken();

  config.headers = {
    ...config.headers,
    authorization: `Bearer ${token}`,
  };

  try {
    const response: AxiosResponse<T> = await client.request<T>(config);
    return response.data;
  } catch (error: any) {
    // If 401, clear cache and retry once
    if (error?.response?.status === 401 && !retried) {
      console.log('[SeuFisio Client] Got 401, refreshing token...');
      clearTokenCache();
      return makeRequest<T>(config, true);
    }
    throw error;
  }
}

export const seufisioClient = {
  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    return makeRequest<T>({ method: "GET", url, params });
  },

  async post<T = any>(url: string, data?: any): Promise<T> {
    return makeRequest<T>({
      method: "POST",
      url,
      data,
      headers: { "content-type": "application/json" },
    });
  },

  async put<T = any>(url: string, data?: any): Promise<T> {
    return makeRequest<T>({
      method: "PUT",
      url,
      data,
      headers: { "content-type": "application/json" },
    });
  },
};
