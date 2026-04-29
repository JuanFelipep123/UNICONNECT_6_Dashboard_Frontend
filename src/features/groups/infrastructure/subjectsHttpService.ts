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

const toStringSafe = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

const normalizeSubject = (raw: unknown): Subject | null => {
  if (!raw || typeof raw !== 'object') return null;

  const subject = raw as Record<string, unknown>;
  const id =
    toStringSafe(subject.id) ||
    toStringSafe(subject.subject_id) ||
    toStringSafe(subject.subjectId) ||
    toStringSafe(subject.materia_id) ||
    toStringSafe(subject.materiaId) ||
    toStringSafe(subject.course_id) ||
    toStringSafe(subject.courseId);

  const name =
    toStringSafe(subject.name) ||
    toStringSafe(subject.subject_name) ||
    toStringSafe(subject.subjectName) ||
    toStringSafe(subject.materia_nombre) ||
    toStringSafe(subject.materiaName) ||
    toStringSafe(subject.course_name) ||
    toStringSafe(subject.courseName) ||
    toStringSafe(subject.label);

  if (!id || !name) return null;

  return { id, name };
};

const normalizeSubjects = (items: unknown[]): Subject[] => {
  return items.map(normalizeSubject).filter((subject): subject is Subject => subject !== null);
};

export const subjectsHttpService = {
  async getUserSubjects(token?: string | null): Promise<ApiResponse<Subject[]>> {
    try {
      const response = await fetch(`${SUBJECTS_ENDPOINT}/my-subjects`, {
        method: 'GET',
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
        return { success: true, data: normalizeSubjects(json) };
      }

      if (json && typeof json === 'object') {
        const payload = json as Record<string, unknown>;
        if (Array.isArray(payload.data)) return { success: true, data: normalizeSubjects(payload.data) };
        if (Array.isArray(payload.subjects)) return { success: true, data: normalizeSubjects(payload.subjects) };
      }

      return { success: true, data: [] };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
