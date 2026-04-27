import { API_BASE_URL } from '@shared/services/api/apiClient';
import type { ApiResponse, Subject } from '../domain/groups';

const SUBJECTS_ENDPOINT = `${API_BASE_URL}/subjects`;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: unknown, fallbackStatus: number): string => {
  if (payload && typeof payload === 'object') {
    const maybeError = payload as Record<string, unknown>;
    if (typeof maybeError.error === 'string' && maybeError.error.trim()) return maybeError.error;
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) return maybeError.message;
  }
  return `Error ${fallbackStatus}`;
};

export const subjectsHttpService = {
  async getUserSubjects(token?: string | null): Promise<ApiResponse<Subject[]>> {
    try {
      const response = await fetch(`${SUBJECTS_ENDPOINT}/my-subjects`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await readJson(response);

      if (!response.ok) {
        return { success: false, error: getErrorMessage(json, response.status) };
      }

      if (Array.isArray(json)) {
        return { success: true, data: json as Subject[] };
      }

      if (json && typeof json === 'object') {
        const payload = json as Record<string, unknown>;
        if (Array.isArray(payload.data)) return { success: true, data: payload.data as Subject[] };
        if (Array.isArray(payload.subjects)) return { success: true, data: payload.subjects as Subject[] };
      }

      return { success: true, data: [] };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
