import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@shared/store/authStore';
import type { StudyGroup } from '../../domain/groups';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';
import { subjectsHttpService } from '../../infrastructure/subjectsHttpService';

interface StudyGroupRealtimePayload {
  groupId: string;
  members?: unknown[];
  pendingRequests?: unknown[];
}

const realtimeSocketUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL || 'http://localhost:3000';

const toUserIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'number') return String(item);
      if (item && typeof item === 'object') {
        const maybeUser = item as Record<string, unknown>;
        if (typeof maybeUser.id === 'string') return maybeUser.id;
        if (typeof maybeUser.userId === 'string') return maybeUser.userId;
        if (typeof maybeUser.user_id === 'string') return maybeUser.user_id;
        if (typeof maybeUser.profile_id === 'string') return maybeUser.profile_id;
      }
      return '';
    })
    .filter((id) => id.length > 0);
};

interface UseUserGroupsReturn {
  adminGroups: StudyGroup[];
  participantGroups: StudyGroup[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useUserGroups = (): UseUserGroupsReturn => {
  const currentUserId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const groupsRef = useRef<StudyGroup[]>([]);
  const subjectsMapRef = useRef<Map<string, string>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  const enrichGroupWithSubject = useCallback((group: StudyGroup): StudyGroup => {
    if (group.subject?.name) return group;

    const normalizedSubjectId = String(group.subject_id || '').trim();
    if (!normalizedSubjectId) return group;

    const resolvedSubjectName = subjectsMapRef.current.get(normalizedSubjectId);
    if (!resolvedSubjectName) return group;

    return {
      ...group,
      subject: {
        id: normalizedSubjectId,
        name: resolvedSubjectName,
      },
    };
  }, []);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await groupsHttpService.getUserGroups(token);

    if (!response.success || !response.data) {
      setGroups([]);
      setError(response.error ?? 'No se pudieron cargar los grupos');
      setLoading(false);
      return;
    }

    const detailedGroups = await Promise.all(
      response.data.map(async (group) => {
        const detailResponse = await groupsHttpService.getGroup(group.id, token);

        if (!detailResponse.success || !detailResponse.data) {
          return group;
        }

        return {
          ...group,
          ...detailResponse.data,
          // Preserve list-specific permission flags from /my-groups.
          is_admin: group.is_admin,
          is_member: group.is_member,
        };
      }),
    );

    const subjectsResponse = await subjectsHttpService.getUserSubjects(token);
    const nextSubjectsMap = new Map<string, string>();
    for (const subject of subjectsResponse.data ?? []) {
      const normalizedId = String(subject.id).trim();
      if (!normalizedId || !subject.name) continue;
      nextSubjectsMap.set(normalizedId, subject.name);
    }
    subjectsMapRef.current = nextSubjectsMap;

    const enrichedGroups = detailedGroups.map(enrichGroupWithSubject);

    setGroups(enrichedGroups);
    setLoading(false);
  }, [enrichGroupWithSubject, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!token || !currentUserId) return;

    const socket = io(realtimeSocketUrl, {
      auth: {
        'x-user-id': currentUserId,
        Authorization: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    const joinKnownGroups = () => {
      for (const group of groupsRef.current) {
        socket.emit('study-group:join', { groupId: group.id });
      }
    };

    const handleStudyGroupUpdated = (payload: StudyGroupRealtimePayload) => {
      const hasMembers = Array.isArray(payload.members);
      const hasPending = Array.isArray(payload.pendingRequests);
      const nextMembers = hasMembers ? toUserIds(payload.members) : [];
      const nextPendingRequests = hasPending ? toUserIds(payload.pendingRequests) : [];

      setGroups((currentGroups) =>
        currentGroups.map((group) => {
          if (group.id !== payload.groupId) return group;

          return {
            ...group,
            members: hasMembers ? nextMembers : group.members,
            member_count: hasMembers ? nextMembers.length : group.member_count,
            pendingRequests: hasPending ? nextPendingRequests : group.pendingRequests,
          };
        }),
      );

      // Re-sync with backend detail so cards also reflect latest subject/name/description if changed.
      void (async () => {
        const detailResponse = await groupsHttpService.getGroup(payload.groupId, token);
        if (!detailResponse.success || !detailResponse.data) return;
        const detailGroup = detailResponse.data;

        setGroups((currentGroups) =>
          currentGroups.map((group) => {
            if (group.id !== payload.groupId) return group;

            return enrichGroupWithSubject({
              ...group,
              ...detailGroup,
              subject: detailGroup.subject ?? group.subject,
              is_admin: group.is_admin,
            });
          }),
        );
      })();
    };

    socket.on('connect', joinKnownGroups);
    socket.on('study-group:updated', handleStudyGroupUpdated);

    if (socket.connected) {
      joinKnownGroups();
    }

    return () => {
      for (const group of groupsRef.current) {
        socket.emit('study-group:leave', { groupId: group.id });
      }
      socket.off('connect', joinKnownGroups);
      socket.off('study-group:updated', handleStudyGroupUpdated);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, enrichGroupWithSubject, token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    for (const group of groups) {
      socket.emit('study-group:join', { groupId: group.id });
    }
  }, [groups]);

  const adminGroups = useMemo(() => groups.filter((group) => group.is_admin), [groups]);
  const participantGroups = useMemo(() => groups.filter((group) => !group.is_admin), [groups]);

  return { adminGroups, participantGroups, loading, error, reload };
};
