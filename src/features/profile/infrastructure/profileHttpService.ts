import { API_BASE_URL } from '@shared/services/api/apiClient';
import type { ProfileData, ProfileSubject } from '../domain/profile';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const readJson = async (response: Response): Promise<unknown> => {
  try { return await response.json(); } catch { return null; }
};

const getErrorMessage = (payload: unknown, fallbackStatus: number): string => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
  }
  return `Error ${fallbackStatus}`;
};

const normalizeAvatarUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return trimmed.startsWith('/') ? `${origin}${trimmed}` : `${origin}/${trimmed}`;
};

const normalizeProfile = (raw: unknown): ProfileData | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  // Unwrap { data: { ... } } if present
  const inner = (obj.data && typeof obj.data === 'object') ? obj.data as Record<string, unknown> : obj;

  const id = String(inner.id ?? inner.user_id ?? inner.userId ?? '');
  if (!id) return null;

  return {
    id,
    name: (inner.name ?? inner.full_name ?? inner.fullName ?? '') as string || undefined,
    email: (inner.email ?? '') as string || undefined,
    avatar_url: normalizeAvatarUrl(inner.avatar_url ?? inner.avatarUrl ?? inner.avatar),
    career: (inner.career ?? inner.program ?? null) as string | null,
    semester: typeof inner.semester === 'number' ? inner.semester : (inner.semester ? Number(inner.semester) : null),
    phone_number: (inner.phone_number ?? inner.phoneNumber ?? null) as string | null,
    created_at: (inner.created_at ?? inner.createdAt ?? '') as string || undefined,
  };
};

const extractSubjects = (payload: unknown): ProfileSubject[] => {
  if (Array.isArray(payload)) return payload as ProfileSubject[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as ProfileSubject[];
    if (Array.isArray(obj.subjects)) return obj.subjects as ProfileSubject[];
  }
  return [];
};

export const profileHttpService = {
  async getProfile(userId: string, token: string): Promise<ApiResponse<ProfileData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(json, response.status) };
      const profile = normalizeProfile(json);
      return profile ? { success: true, data: profile } : { success: false, error: 'Perfil no encontrado.' };
    } catch {
      return { success: false, error: 'Error de conexión.' };
    }
  },

  async updateProfile(userId: string, data: Partial<ProfileData>, token: string): Promise<ApiResponse<ProfileData>> {
    try {
      const payload: Record<string, unknown> = {};
      if (data.semester !== undefined) payload.semester = data.semester;
      if (data.phone_number !== undefined) payload.phone_number = data.phone_number;
      if (data.avatar_url !== undefined) payload.avatar_url = data.avatar_url;
      if (data.career !== undefined) payload.career = data.career;

      const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(json, response.status) };
      const profile = normalizeProfile(json);
      return profile ? { success: true, data: profile } : { success: true };
    } catch {
      return { success: false, error: 'Error de conexión.' };
    }
  },

  async getProfileSubjects(profileId: string, token: string): Promise<ApiResponse<ProfileSubject[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile-subjects/${profileId}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(json, response.status) };
      return { success: true, data: extractSubjects(json) };
    } catch {
      return { success: false, error: 'Error de conexión.' };
    }
  },

  async getAvailableSubjects(token: string, options?: { career?: string; limit?: number }): Promise<ApiResponse<ProfileSubject[]>> {
    try {
      const query = new URLSearchParams();
      if (options?.career?.trim()) { query.append('career', options.career.trim()); query.append('program', options.career.trim()); }
      if (options?.limit) query.append('limit', String(options.limit));
      const qs = query.toString();
      const url = `${API_BASE_URL}/subjects${qs ? `?${qs}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(json, response.status) };
      return { success: true, data: extractSubjects(json) };
    } catch {
      return { success: false, error: 'Error de conexión.' };
    }
  },

  async addSubjectToProfile(profileId: string, subjectId: string, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile-subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profile_id: profileId, subject_id: subjectId }),
      });
      const json = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(json, response.status) };
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión.' };
    }
  },

  async removeSubjectFromProfile(profileId: string, subjectId: string, token: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile-subjects`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profile_id: profileId, subject_id: subjectId }),
      });
      const json = await readJson(response);
      if (!response.ok) return { success: false, error: getErrorMessage(json, response.status) };
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión.' };
    }
  },

  async uploadAvatar(userId: string, file: File, token: string): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/profiles/${userId}/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await readJson(response) as Record<string, unknown> | null;
      if (!response.ok) return { success: false, error: getErrorMessage(json, response.status) };

      // Try to extract the avatar URL from various response shapes
      const url = normalizeAvatarUrl(json?.url ?? json?.avatar_url ?? (json?.data as Record<string, unknown>)?.url ?? (json?.data as Record<string, unknown>)?.avatar_url);
      if (url) return { success: true, data: { url } };

      // Upload may have succeeded but URL not returned — caller should re-fetch profile
      return { success: true, data: { url: '' } };
    } catch {
      return { success: false, error: 'Error de conexión al subir avatar.' };
    }
  },
};
