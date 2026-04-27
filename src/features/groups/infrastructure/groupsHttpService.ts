import { API_BASE_URL } from '@shared/services/api/apiClient';
import type { ApiResponse, CreateGroupResponse, StudyGroup, StudyGroupCreatePayload } from '../domain/groups';

const GROUPS_ENDPOINT = `${API_BASE_URL}/study-groups`;

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
    if (typeof maybeError.error === 'string' && maybeError.error.trim().length > 0) {
      return maybeError.error;
    }
    if (typeof maybeError.message === 'string' && maybeError.message.trim().length > 0) {
      return maybeError.message;
    }
  }
  return `Error ${fallbackStatus}`;
};

const toStringSafe = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

const toNumberSafe = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toBooleanSafe = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return false;
};

const resolveSubject = (rawGroup: Record<string, unknown>) => {
  const rawSubject = rawGroup.subject;

  if (rawSubject && typeof rawSubject === 'object') {
    const subjectObj = rawSubject as Record<string, unknown>;
    const id = toStringSafe(subjectObj.id);
    const name = toStringSafe(subjectObj.name);
    if (name) {
      return { id, name };
    }
  }

  const subjectName =
    toStringSafe(rawGroup.subject_name) ||
    toStringSafe(rawGroup.subjectName) ||
    toStringSafe(rawGroup.materia_nombre) ||
    toStringSafe(rawGroup.materiaName);

  if (!subjectName) return undefined;

  return {
    id: toStringSafe(rawGroup.subject_id) || toStringSafe(rawGroup.subjectId),
    name: subjectName,
  };
};

const normalizeGroup = (raw: unknown): StudyGroup => {
  const rawGroup = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: toStringSafe(rawGroup.id),
    name: toStringSafe(rawGroup.name),
    description: toStringSafe(rawGroup.description),
    subject_id: toStringSafe(rawGroup.subject_id) || toStringSafe(rawGroup.subjectId),
    subject: resolveSubject(rawGroup),
    category: rawGroup.category as StudyGroup['category'],
    creator_id:
      toStringSafe(rawGroup.creator_id) ||
      toStringSafe(rawGroup.creatorId) ||
      toStringSafe(rawGroup.created_by) ||
      toStringSafe(rawGroup.createdBy),
    created_at: toStringSafe(rawGroup.created_at) || toStringSafe(rawGroup.createdAt),
    updated_at: toStringSafe(rawGroup.updated_at) || toStringSafe(rawGroup.updatedAt) || undefined,
    member_count:
      toNumberSafe(rawGroup.member_count) ??
      toNumberSafe(rawGroup.memberCount) ??
      toNumberSafe(rawGroup.members_count),
    is_member: toBooleanSafe(rawGroup.is_member ?? rawGroup.isMember),
    is_admin: toBooleanSafe(rawGroup.is_admin ?? rawGroup.isAdmin),
  };
};

export const groupsHttpService = {
  async createGroup(payload: StudyGroupCreatePayload, token?: string | null): Promise<ApiResponse<CreateGroupResponse>> {
    try {
      const response = await fetch(GROUPS_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await readJson(response);

      if (!response.ok) {
        return { success: false, error: getErrorMessage(json, response.status) };
      }

      return { success: true, data: json as CreateGroupResponse };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getGroup(id: string, token?: string | null): Promise<ApiResponse<StudyGroup>> {
    try {
      const response = await fetch(`${GROUPS_ENDPOINT}/${id}`, {
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

      let groupPayload: unknown = json;
      if (json && typeof json === 'object') {
        const payload = json as Record<string, unknown>;
        if (payload.data && typeof payload.data === 'object') {
          groupPayload = payload.data;
        }
      }

      return { success: true, data: normalizeGroup(groupPayload) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getUserGroups(token?: string | null): Promise<ApiResponse<StudyGroup[]>> {
    try {
      const response = await fetch(`${GROUPS_ENDPOINT}/my-groups`, {
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

      let groupsArrayRaw: unknown[] = [];
      if (Array.isArray(json)) {
        groupsArrayRaw = json;
      } else if (json && typeof json === 'object') {
        const payload = json as Record<string, unknown>;
        if (Array.isArray(payload.data)) groupsArrayRaw = payload.data;
        else if (Array.isArray(payload.groups)) groupsArrayRaw = payload.groups;
      }

      return { success: true, data: groupsArrayRaw.map(normalizeGroup) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
