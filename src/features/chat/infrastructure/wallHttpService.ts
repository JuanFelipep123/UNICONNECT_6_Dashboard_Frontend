import { chatFetch } from './chatHttpClient';
import { useAuthStore } from '@shared/store/authStore';
import { API_BASE_URL } from '@shared/services/api/apiClient';
import type { ChatApiResponse, GroupMember, WallAttachment, WallInboxItem, WallPost } from '../domain/wall';

const GROUPS_BASE = `${API_BASE_URL}/study-groups`;

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

const normalizeAttachment = (raw: unknown): WallAttachment => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: typeof r.id === 'string' ? r.id : undefined,
    fileName: toStr(r.fileName ?? r.file_name),
    fileType: toStr(r.fileType ?? r.file_type),
    fileSize:
      typeof r.fileSize === 'number'
        ? r.fileSize
        : typeof r.file_size === 'number'
          ? r.file_size
          : 0,
    storagePath: toStr(r.storagePath ?? r.storage_path),
  };
};

const normalizePost = (raw: unknown): WallPost => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: toStr(r.id),
    groupId: toStr(r.groupId ?? r.group_id),
    senderId: toStr(r.senderId ?? r.sender_id),
    senderName:
      typeof r.senderName === 'string'
        ? r.senderName
        : typeof r.sender_name === 'string'
          ? r.sender_name
          : undefined,
    avatarUrl:
      typeof r.avatarUrl === 'string'
        ? r.avatarUrl
        : typeof r.avatar_url === 'string'
          ? r.avatar_url
          : undefined,
    content: toStr(r.content),
    createdAt: toStr(r.createdAt ?? r.created_at),
    attachments: Array.isArray(r.attachments) ? r.attachments.map(normalizeAttachment) : [],
    mentions: Array.isArray(r.mentions)
      ? r.mentions.filter((m): m is string => typeof m === 'string')
      : [],
    mentionedNames: Array.isArray(r.mentionedNames)
      ? r.mentionedNames.filter((m): m is string => typeof m === 'string')
      : Array.isArray(r.mentioned_names)
        ? r.mentioned_names.filter((m): m is string => typeof m === 'string')
        : [],
  };
};

const normalizeInboxItem = (raw: unknown): WallInboxItem => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    groupId: toStr(r.groupId ?? r.group_id),
    groupName: toStr(r.groupName ?? r.group_name),
    lastPost:
      r.lastPost != null
        ? normalizePost(r.lastPost)
        : r.last_post != null
          ? normalizePost(r.last_post)
          : null,
  };
};

export { normalizePost as normalizeWallPost };

export const wallHttpService = {
  async getWalls(): Promise<ChatApiResponse<WallInboxItem[]>> {
    try {
      const response = await chatFetch('/walls');
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      let items: unknown[] = [];
      if (Array.isArray(json)) {
        items = json;
      } else if (json && typeof json === 'object') {
        const p = json as Record<string, unknown>;
        if (Array.isArray(p.data)) items = p.data;
        else if (Array.isArray(p.walls)) items = p.walls;
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

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      let posts: unknown[] = [];
      if (Array.isArray(json)) {
        posts = json;
      } else if (json && typeof json === 'object') {
        const p = json as Record<string, unknown>;
        if (Array.isArray(p.data)) posts = p.data;
        else if (Array.isArray(p.posts)) posts = p.posts;
      }

      return { success: true, data: posts.map(normalizePost) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async sendPost(
    groupId: string,
    content: string,
    attachments: WallAttachment[] = [],
    mentions: string[] = [],
    mentionedNames: string[] = [],
  ): Promise<ChatApiResponse<WallPost>> {
    try {
      const response = await chatFetch(`/groups/${encodeURIComponent(groupId)}/wall`, {
        method: 'POST',
        body: JSON.stringify({ content, attachments, mentions, mentionedNames }),
      });
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      const post = normalizePost(json);
      // Preserve mentionedNames locally if the backend doesn't echo them yet
      if (post.mentionedNames.length === 0 && mentionedNames.length > 0) {
        post.mentionedNames = mentionedNames;
      }
      return { success: true, data: post };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getGroupMembers(groupId: string): Promise<ChatApiResponse<GroupMember[]>> {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${GROUPS_BASE}/${encodeURIComponent(groupId)}/members`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      let items: unknown[] = [];
      if (json && typeof json === 'object') {
        const p = json as Record<string, unknown>;
        if (Array.isArray(p.data)) items = p.data;
        else if (Array.isArray(p.members)) items = p.members;
      } else if (Array.isArray(json)) {
        items = json;
      }

      const members: GroupMember[] = items
        .filter((m): m is Record<string, unknown> => m !== null && typeof m === 'object')
        .map((m) => ({ id: toStr(m.id), name: toStr(m.name) }))
        .filter((m) => m.id && m.name);

      return { success: true, data: members };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getAttachmentUrl(attachmentId: string): Promise<ChatApiResponse<string>> {
    try {
      const response = await chatFetch(
        `/attachments/wall/${encodeURIComponent(attachmentId)}/url`,
      );
      const json = await safeJson(response);

      if (!response.ok) return { success: false, error: getError(json, response.status) };

      const url =
        typeof json === 'string'
          ? json
          : json && typeof json === 'object'
            ? (toStr((json as Record<string, unknown>).url) ||
               toStr((json as Record<string, unknown>).signedUrl) ||
               toStr((json as Record<string, unknown>).signed_url))
            : '';

      if (!url) return { success: false, error: 'La respuesta no contiene una URL válida.' };
      return { success: true, data: url };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
