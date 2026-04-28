import type { Auth0UserInfo, AuthConfig } from '../types/auth.types';

export function getAuthConfig(): AuthConfig {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN?.trim() ?? '';
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID?.trim() ?? '';
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE?.trim() ?? '';
  const connection = import.meta.env.VITE_AUTH0_CONNECTION?.trim() || 'google-oauth2';
  const authSyncUrl = import.meta.env.VITE_AUTH_SYNC_URL?.trim() ?? '';
  const backendBaseUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL?.trim() ?? '';
  const authSessionUrl =
    import.meta.env.VITE_AUTH_SESSION_URL?.trim() ||
    (backendBaseUrl ? `${backendBaseUrl}/auth/session` : '');
  const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI?.trim() || `${window.location.origin}/auth/callback`;

  return {
    domain,
    clientId,
    audience: audience || undefined,
    connection,
    authSyncUrl,
    authSessionUrl,
    redirectUri,
  };
}

export function validateAuthConfig(config: AuthConfig): string[] {
  const missing: string[] = [];

  if (!config.domain) missing.push('VITE_AUTH0_DOMAIN');
  if (!config.clientId) missing.push('VITE_AUTH0_CLIENT_ID');

  return missing;
}

export function buildAuthorizeUrl(config: AuthConfig, state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    prompt: 'select_account',
    connection: config.connection,
  });

  if (config.audience) {
    params.set('audience', config.audience);
  }

  return `https://${config.domain}/authorize?${params.toString()}`;
}

interface ExchangeCodeParams {
  config: AuthConfig;
  code: string;
  codeVerifier: string;
}

export async function exchangeCodeForToken(params: ExchangeCodeParams): Promise<string> {
  const { config, code, codeVerifier } = params;

  const response = await fetch(`https://${config.domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const payload = (await response.json()) as { access_token?: string; error_description?: string };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || 'No se pudo intercambiar el codigo de Auth0 por token.');
  }

  return payload.access_token;
}

export async function fetchAuth0UserInfo(accessToken: string, domain: string): Promise<Auth0UserInfo> {
  const response = await fetch(`https://${domain}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json()) as Auth0UserInfo;

  if (!response.ok) {
    throw new Error('No se pudo obtener la informacion del usuario en Auth0.');
  }

  return payload;
}

export function isValidInstitutionalEmail(email: string): boolean {
  return /@ucaldas\.edu\.co$/i.test(email);
}
