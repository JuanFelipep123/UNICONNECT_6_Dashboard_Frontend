import type { AuthSession, AuthSyncResponse } from '../types/auth.types';

function safeParseJson<T>(value: string): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractSessionFromResponse(payload: unknown): AuthSession | null {
  if (!payload || typeof payload !== 'object') return null;

  const source = payload as AuthSyncResponse;
  const nestedCandidates = [source, source.data, source.user, source.profile].filter(Boolean) as AuthSyncResponse[];

  for (const candidate of nestedCandidates) {
    const token = candidate.token ?? candidate.access_token ?? null;
    const userId = candidate.userId ?? candidate.user_id ?? candidate.profile_id ?? candidate.id;
    const rawNeedsOnboarding = candidate.needsOnboarding ?? candidate.needs_onboarding;
    const needsOnboarding = typeof rawNeedsOnboarding === 'boolean' ? rawNeedsOnboarding : false;

    if (userId) {
      return { token, userId, needsOnboarding };
    }
  }

  return null;
}

export async function syncUserWithBackend(authSyncUrl: string, accessToken: string): Promise<AuthSession> {
  let response: Response;

  try {
    response = await fetch(authSyncUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new Error('No fue posible conectar con el backend para sincronizar la sesion.');
  }

  const rawBody = await response.text();
  const parsedBody = safeParseJson<unknown>(rawBody);

  if (response.status === 401) {
    throw new Error('Tu sesion no fue aceptada por el servidor. Inicia sesion nuevamente.');
  }

  if (!response.ok) {
    throw new Error(`Error al sincronizar usuario (${response.status}).`);
  }

  const session = extractSessionFromResponse(parsedBody);
  if (!session) {
    throw new Error('Respuesta de auth/sync sin token o userId. Verifica el contrato del backend.');
  }

  return session;
}

export async function restoreSessionFromBackend(authSessionUrl: string): Promise<AuthSession | null> {
  let response: Response;

  try {
    response = await fetch(authSessionUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const rawBody = await response.text();
  const parsedBody = safeParseJson<unknown>(rawBody);
  return extractSessionFromResponse(parsedBody);
}
