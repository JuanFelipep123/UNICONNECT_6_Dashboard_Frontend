import { chatFetch } from './chatHttpClient';
import type { ChatApiResponse, WallInboxItem, WallPost } from '../domain/wall';

const safeJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getError = (payload: unknown, status: number): string => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
  }
  return `Error ${status}`;
};

const toStr = (v: unknown): string => (typeof v === 'string' ? v : '');

const normalizePost = (raw: unknown): WallPost => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: toStr(r.id),
    groupId: toStr(r.groupId ?? r.group_id),
    senderId: toStr(r.senderId ?? r.sender_id),
    senderName: typeof r.senderName === 'string' ? r.senderName : typeof r.sender_name === 'string' ? r.sender_name : undefined,
    content: toStr(r.content),
    createdAt: toStr(r.createdAt ?? r.created_at),
    attachments: Array.isArray(r.attachments) ? r.attachments : [],
  };
};

const normalizeInboxItem = (raw: unknown): WallInboxItem => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    groupId: toStr(r.groupId ?? r.group_id),
    groupName: toStr(r.groupName ?? r.group_name),
    lastPost: r.lastPost != null ? normalizePost(r.lastPost) : r.last_post != null ? normalizePost(r.last_post) : null,
  };
};

export { normalizePost as normalizeWallPost };

export const wallHttpService = {
  async getWalls(): Promise<ChatApiResponse<WallInboxItem[]>> {
    try {
      const response = await chatFetch('/walls');
      const json = await safeJson(response);

      if (!response.ok) {
        return { success: false, error: getError(json, response.status) };
      }

      let items: unknown[] = [];
      if (Array.isArray(json)) {
        items = json;
      } else if (json && typeof json === 'object') {
        const payload = json as Record<string, unknown>;
        if (Array.isArray(payload.data)) items = payload.data;
        else if (Array.isArray(payload.walls)) items = payload.walls;
      }

      return { success: true, data: items.map(normalizeInboxItem) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getWallHistory(
    groupId: string,
    params?: { limit?: number; before?: string },
  ): Promise<ChatApiResponse<WallPost[]>> {
    try {
      const query = new URLSearchParams();
      if (params?.limit != null) query.set('limit', String(params.limit));
      if (params?.before) query.set('before', params.before);
      const qs = query.toString();

      const response = await chatFetch(
        `/groups/${encodeURIComponent(groupId)}/wall${qs ? `?${qs}` : ''}`,
      );
      const json = await safeJson(response);

      if (!response.ok) {
        return { success: false, error: getError(json, response.status) };
      }

      let posts: unknown[] = [];
      if (Array.isArray(json)) {
        posts = json;
      } else if (json && typeof json === 'object') {
        const payload = json as Record<string, unknown>;
        if (Array.isArray(payload.data)) posts = payload.data;
        else if (Array.isArray(payload.posts)) posts = payload.posts;
      }

      return { success: true, data: posts.map(normalizePost) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async sendPost(groupId: string, content: string): Promise<ChatApiResponse<WallPost>> {
    try {
      const response = await chatFetch(`/groups/${encodeURIComponent(groupId)}/wall`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const json = await safeJson(response);

      if (!response.ok) {
        return { success: false, error: getError(json, response.status) };
      }

      return { success: true, data: normalizePost(json) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
