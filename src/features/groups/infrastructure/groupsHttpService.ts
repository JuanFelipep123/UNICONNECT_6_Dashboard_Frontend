import { API_BASE_URL } from '@shared/services/api/apiClient';
import type {
  ApiResponse,
  CreateGroupResponse,
  StudyGroup,
  StudyGroupCreatePayload,
  UserProfileSummary,
} from '../domain/groups';

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

const getStatusMessage = (
  status: number,
  operation: 'get-group' | 'accept-request' | 'reject-request' | 'get-profile',
): string => {
  if (status === 401) return 'Tu sesion expiro. Inicia sesion nuevamente.';
  if (status === 403) return 'No tienes permisos para realizar esta accion.';

  if (operation === 'get-group' && status === 404) {
    return 'No se encontro el grupo solicitado.';
  }

  if ((operation === 'accept-request' || operation === 'reject-request') && status === 404) {
    return 'No se encontro la solicitud pendiente indicada.';
  }

  if ((operation === 'accept-request' || operation === 'reject-request') && status === 409) {
    return 'La solicitud ya fue procesada o entro en conflicto.';
  }

  if (operation === 'get-profile' && status === 404) {
    return 'No se encontro el perfil del usuario.';
  }

  return `Error ${status}`;
};

const resolveApiError = (
  payload: unknown,
  status: number,
  operation: 'get-group' | 'accept-request' | 'reject-request' | 'get-profile',
) => {
  const payloadMessage = getErrorMessage(payload, status);
  if (payloadMessage !== `Error ${status}`) return payloadMessage;
  return getStatusMessage(status, operation);
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

const resolveSubjectId = (rawGroup: Record<string, unknown>): string => {
  const rawSubject = rawGroup.subject;
  if (rawSubject && typeof rawSubject === 'object') {
    const subjectObj = rawSubject as Record<string, unknown>;
    const nestedId = toStringSafe(subjectObj.id) || toStringSafe(subjectObj.subject_id) || toStringSafe(subjectObj.subjectId);
    if (nestedId) return nestedId;
  }

  return (
    toStringSafe(rawGroup.subject_id) ||
    toStringSafe(rawGroup.subjectId) ||
    toStringSafe(rawGroup.materia_id) ||
    toStringSafe(rawGroup.materiaId) ||
    toStringSafe(rawGroup.course_id) ||
    toStringSafe(rawGroup.courseId)
  );
};

const toUserId = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const asObj = value as Record<string, unknown>;
    return (
      toStringSafe(asObj.id) ||
      toStringSafe(asObj.userId) ||
      toStringSafe(asObj.user_id) ||
      toStringSafe(asObj.profile_id)
    );
  }
  return '';
};

const toUserIdsArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map(toUserId).filter((id) => id.length > 0);
};

const extractGroupPayload = (json: unknown): unknown => {
  if (!json || typeof json !== 'object') return json;
  const payload = json as Record<string, unknown>;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  if (payload.group && typeof payload.group === 'object') return payload.group;
  return json;
};

const normalizeProfile = (raw: unknown, fallbackId: string): UserProfileSummary => {
  const rawProfile = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const id =
    toStringSafe(rawProfile.id) ||
    toStringSafe(rawProfile.userId) ||
    toStringSafe(rawProfile.user_id) ||
    toStringSafe(rawProfile.profile_id) ||
    fallbackId;

  const fullName =
    toStringSafe(rawProfile.name) ||
    toStringSafe(rawProfile.full_name) ||
    toStringSafe(rawProfile.fullName) ||
    toStringSafe(rawProfile.display_name) ||
    toStringSafe(rawProfile.displayName) ||
    toStringSafe(rawProfile.nickname) ||
    toStringSafe(rawProfile.email) ||
    `Usuario ${id.slice(0, 8)}`;

  const avatarUrl =
    toStringSafe(rawProfile.avatar) ||
    toStringSafe(rawProfile.avatar_url) ||
    toStringSafe(rawProfile.avatarUrl) ||
    toStringSafe(rawProfile.picture) ||
    toStringSafe(rawProfile.photo) ||
    toStringSafe(rawProfile.photo_url) ||
    toStringSafe(rawProfile.image);

  return {
    id,
    fullName,
    avatarUrl: avatarUrl || undefined,
  };
};

const resolveSubject = (rawGroup: Record<string, unknown>) => {
  const rawSubject = rawGroup.subject;

  if (typeof rawSubject === 'string' && rawSubject.trim().length > 0) {
    return {
      id: resolveSubjectId(rawGroup),
      name: rawSubject,
    };
  }

  if (rawSubject && typeof rawSubject === 'object') {
    const subjectObj = rawSubject as Record<string, unknown>;
    const id = toStringSafe(subjectObj.id);
    const name =
      toStringSafe(subjectObj.name) ||
      toStringSafe(subjectObj.subject_name) ||
      toStringSafe(subjectObj.materia_nombre) ||
      toStringSafe(subjectObj.label);
    if (name) {
      return { id, name };
    }
  }

  const rawMateria = rawGroup.materia;
  if (typeof rawMateria === 'string' && rawMateria.trim().length > 0) {
    return {
      id: resolveSubjectId(rawGroup),
      name: rawMateria,
    };
  }

  const subjectName =
    toStringSafe(rawGroup.subject_name) ||
    toStringSafe(rawGroup.subjectName) ||
    toStringSafe(rawGroup.materia_nombre) ||
    toStringSafe(rawGroup.materiaName) ||
    toStringSafe(rawGroup.course_name) ||
    toStringSafe(rawGroup.courseName);

  if (!subjectName) return undefined;

  return {
    id: resolveSubjectId(rawGroup),
    name: subjectName,
  };
};

const normalizeGroup = (raw: unknown): StudyGroup => {
  const rawGroup = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const members = toUserIdsArray(rawGroup.members);
  const pendingRequests = toUserIdsArray(rawGroup.pendingRequests ?? rawGroup.pending_requests);

  return {
    id: toStringSafe(rawGroup.id),
    name: toStringSafe(rawGroup.name),
    description: toStringSafe(rawGroup.description),
    subject_id: resolveSubjectId(rawGroup),
    subject: resolveSubject(rawGroup),
    category: rawGroup.category as StudyGroup['category'],
    createdBy: toStringSafe(rawGroup.createdBy) || toStringSafe(rawGroup.created_by) || undefined,
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
      toNumberSafe(rawGroup.members_count) ??
      members.length,
    members,
    pendingRequests,
    pendingAdminTransfer: rawGroup.pendingAdminTransfer as StudyGroup['pendingAdminTransfer'],
    is_member: toBooleanSafe(rawGroup.is_member ?? rawGroup.isMember),
    is_admin: toBooleanSafe(rawGroup.is_admin ?? rawGroup.isAdmin),
  };
};

export const groupsHttpService = {
  async createGroup(payload: StudyGroupCreatePayload, token?: string | null): Promise<ApiResponse<CreateGroupResponse>> {
    try {
      const response = await fetch(GROUPS_ENDPOINT, {
        method: 'POST',
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

      // Backend wraps the created group inside { data: { ... } } via sendServiceResult
      const unwrapped = extractGroupPayload(json) as CreateGroupResponse;
      return { success: true, data: unwrapped };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getGroup(id: string, token?: string | null): Promise<ApiResponse<StudyGroup>> {
    try {
      const response = await fetch(`${GROUPS_ENDPOINT}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await readJson(response);

      if (!response.ok) {
        return { success: false, error: resolveApiError(json, response.status, 'get-group') };
      }

      return { success: true, data: normalizeGroup(extractGroupPayload(json)) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async acceptRequest(groupId: string, userId: string, token?: string | null): Promise<ApiResponse<StudyGroup>> {
    try {
      const response = await fetch(`${GROUPS_ENDPOINT}/${groupId}/requests/${userId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await readJson(response);

      if (!response.ok) {
        return { success: false, error: resolveApiError(json, response.status, 'accept-request') };
      }

      return { success: true, data: normalizeGroup(extractGroupPayload(json)) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async rejectRequest(groupId: string, userId: string, token?: string | null): Promise<ApiResponse<StudyGroup>> {
    try {
      const response = await fetch(`${GROUPS_ENDPOINT}/${groupId}/requests/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await readJson(response);

      if (!response.ok) {
        return { success: false, error: resolveApiError(json, response.status, 'reject-request') };
      }

      return { success: true, data: normalizeGroup(extractGroupPayload(json)) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getProfileById(userId: string, token?: string | null): Promise<ApiResponse<UserProfileSummary>> {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await readJson(response);

      if (!response.ok) {
        return { success: false, error: resolveApiError(json, response.status, 'get-profile') };
      }

      return { success: true, data: normalizeProfile(extractGroupPayload(json), userId) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async getUserGroups(token?: string | null): Promise<ApiResponse<StudyGroup[]>> {
    try {
      const response = await fetch(`${GROUPS_ENDPOINT}/my-groups`, {
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


  async leaveGroup(groupId: string, token?: string | null): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await fetch(`${GROUPS_ENDPOINT}/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await readJson(response);

      if (!response.ok) {
        const errorMessage =
          response.status === 403
            ? 'El administrador no puede abandonar el grupo sin transferir la administración.'
            : response.status === 404
              ? 'No se encontró el grupo.'
              : getErrorMessage(json, response.status); // 409 y otros: usa el mensaje real del backend
        return { success: false, error: errorMessage };
      }

      return { success: true, data: { success: true } };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async transferAdminAndLeave(
    groupId: string,
    newAdminId: string,
    token?: string | null,
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await fetch(`${GROUPS_ENDPOINT}/${groupId}/transfer-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ newAdminUserId: newAdminId }),
      });

      const json = await readJson(response);

      if (!response.ok) {
        const errorMessage =
          response.status === 403
            ? 'No tienes permisos para transferir la administración.'
            : response.status === 404
              ? 'No se encontró el grupo o el usuario seleccionado.'
              : response.status === 409
                ? 'El usuario seleccionado no es miembro del grupo.'
                : getErrorMessage(json, response.status);
        return { success: false, error: errorMessage };
      }

      return { success: true, data: { success: true } };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },

  async respondTransferAdmin(
    groupId: string,
    action: 'accept' | 'reject',
    token?: string | null,
  ): Promise<ApiResponse<StudyGroup>> {
    try {
      const response = await fetch(`${GROUPS_ENDPOINT}/${groupId}/transfer-admin/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action }),
      });

      const json = await readJson(response);

      if (!response.ok) {
        const errorMessage =
          response.status === 403
            ? 'No tienes permisos para responder esta solicitud.'
            : response.status === 404
              ? 'No se encontró la solicitud de transferencia.'
              : response.status === 409
                ? 'La solicitud ya fue respondida o expiró.'
                : getErrorMessage(json, response.status);
        return { success: false, error: errorMessage };
      }

      return { success: true, data: normalizeGroup(extractGroupPayload(json)) };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu conexión a internet.' };
    }
  },
};
