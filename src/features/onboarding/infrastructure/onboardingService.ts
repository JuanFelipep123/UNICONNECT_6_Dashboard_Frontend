import { API_BASE_URL } from '@shared/services/api/apiClient';

export interface OnboardingProgramOption {
  name: string;
}

export interface OnboardingStepOnePayload {
  career: string;
  semester: number;
  phoneNumber: string;
}

export interface OnboardingStepOneValidationErrors {
  career?: string;
  semester?: string;
  phone_number?: string;
}

export class OnboardingApiError extends Error {
  status: number;
  validationErrors?: OnboardingStepOneValidationErrors;
  constructor(message: string, status: number, validationErrors?: OnboardingStepOneValidationErrors) {
    super(message);
    this.name = 'OnboardingApiError';
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseJsonBody(bodyText: string): unknown {
  if (!bodyText) return {};
  try { return JSON.parse(bodyText); } catch { return { message: bodyText }; }
}

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const s = payload as Record<string, unknown>;
  return (s.message as string) || ((s.data as Record<string, unknown>)?.message as string) || fallback;
}

function extractValidationErrors(payload: unknown): OnboardingStepOneValidationErrors | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const s = payload as Record<string, unknown>;
  return (s.validationErrors ?? s.validation_errors ?? s.errors ?? (s.data as Record<string, unknown>)?.validationErrors) as OnboardingStepOneValidationErrors | undefined;
}

function extractPrograms(payload: unknown): Array<{ name?: string }> {
  if (Array.isArray(payload)) return payload as Array<{ name?: string }>;
  if (!payload || typeof payload !== 'object') return [];
  const s = payload as Record<string, unknown>;
  for (const key of ['data', 'programs', 'result', 'results', 'subjects']) {
    if (Array.isArray(s[key])) return s[key] as Array<{ name?: string }>;
  }
  return [];
}

// ─── API calls ──────────────────────────────────────────────────────────────

export async function completeOnboarding(token: string, skipped: boolean): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/onboarding/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ skipped }),
    });
  } catch {
    throw new Error('No fue posible completar el onboarding por un problema de red.');
  }
  const bodyText = await response.text();
  if (!response.ok) {
    const parsedBody = parseJsonBody(bodyText);
    throw new OnboardingApiError(
      extractMessage(parsedBody, `No fue posible completar el onboarding (${response.status}).`),
      response.status,
      extractValidationErrors(parsedBody)
    );
  }
}

export async function getOnboardingPrograms(token: string, search = '', limit = 20): Promise<OnboardingProgramOption[]> {
  const query = new URLSearchParams({ limit: String(Math.max(1, Math.min(limit, 100))) });
  if (search.trim()) query.append('search', search.trim());

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/onboarding/programs?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('No fue posible cargar la lista de carreras.');
  }

  const bodyText = await response.text();
  const parsedBody = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new OnboardingApiError(
      extractMessage(parsedBody, `No fue posible consultar programas (${response.status}).`),
      response.status,
      extractValidationErrors(parsedBody)
    );
  }

  return extractPrograms(parsedBody)
    .map((item) => ({ name: (item?.name ?? '').trim() }))
    .filter((item) => item.name.length > 0);
}

export async function autosaveOnboardingContact(token: string, phoneNumber: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/onboarding/step-1/contact`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  } catch {
    // non-blocking
  }
}

export async function submitOnboardingStepOne(token: string, payload: OnboardingStepOnePayload): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/onboarding/step-1`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        career: payload.career,
        semester: payload.semester,
        phone_number: payload.phoneNumber,
      }),
    });
  } catch {
    throw new Error('No fue posible guardar el paso 1 del onboarding.');
  }

  const bodyText = await response.text();
  const parsedBody = parseJsonBody(bodyText);

  if (!response.ok) {
    throw new OnboardingApiError(
      extractMessage(parsedBody, `No fue posible guardar el paso 1 (${response.status}).`),
      response.status,
      extractValidationErrors(parsedBody)
    );
  }
}
