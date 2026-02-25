import axios from 'axios';
import { env } from '../config/env';

const SEUFISIO_API_URL = 'https://api.seufisio.com.br';

interface TokenData {
  accessToken: string;
  expiresAt: number; // unix timestamp in ms
}

let cachedToken: TokenData | null = null;

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  console.log('[SeuFisio Auth] Requesting new access token...');

  const response = await axios.post(
    `${SEUFISIO_API_URL}/oauth/token`,
    {
      username: env.SEUFISIO_USER,
      password: env.SEUFISIO_PASSWORD,
      grant_type: 'password',
      client_id: 2,
      client_secret: env.SEUFISIO_CLIENT_SECRET,
    },
    {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'acesso': 'web-desktop',
        'origin': 'https://app.seufisio.com.br',
        'referer': 'https://app.seufisio.com.br/',
        'x-requested-with': 'XMLHttpRequest',
        'x-version-app': '24',
      },
    }
  );

  const { access_token, expires_in } = response.data;

  cachedToken = {
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  };

  console.log('[SeuFisio Auth] Token acquired, expires in', expires_in, 'seconds');

  return cachedToken.accessToken;
}

/**
 * Clears the cached token (useful when a request fails with 401)
 */
export function clearTokenCache(): void {
  cachedToken = null;
}
