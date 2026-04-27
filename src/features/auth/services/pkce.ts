const PKCE_VERIFIER_KEY = 'auth_pkce_verifier';
const PKCE_STATE_KEY = 'auth_pkce_state';
const PKCE_STORAGE = window.localStorage;

function randomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += charset[randomValues[index] % charset.length];
  }

  return result;
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return toBase64Url(digest);
}

export async function createPkceSession() {
  const verifier = randomString(96);
  const state = randomString(48);
  const challenge = await createCodeChallenge(verifier);

  PKCE_STORAGE.setItem(PKCE_VERIFIER_KEY, verifier);
  PKCE_STORAGE.setItem(PKCE_STATE_KEY, state);

  return { verifier, state, challenge };
}

export function getPkceVerifier(): string | null {
  return PKCE_STORAGE.getItem(PKCE_VERIFIER_KEY);
}

export function assertValidState(receivedState: string | null): boolean {
  const expectedState = PKCE_STORAGE.getItem(PKCE_STATE_KEY);
  return Boolean(receivedState && expectedState && receivedState === expectedState);
}

export function clearPkceSession() {
  PKCE_STORAGE.removeItem(PKCE_VERIFIER_KEY);
  PKCE_STORAGE.removeItem(PKCE_STATE_KEY);
}
