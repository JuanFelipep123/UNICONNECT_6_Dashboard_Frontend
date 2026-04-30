import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@shared/store/authStore';
import type { StudyGroup } from '../../domain/groups';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';

interface StudyGroupRealtimePayload {
  groupId: string;
  members?: unknown[];
  pendingRequests?: unknown[];
}

interface AdminTransferRequestedPayload {
  groupId: string;
  fromUserId: string;
  toUserId: string;
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

interface UseUserGroupsOptions {
  /** Called when the current user is selected as a new admin candidate. */
  onAdminTransferRequested?: (payload: AdminTransferRequestedPayload) => void;
}

interface UseUserGroupsReturn {
  adminGroups: StudyGroup[];
  participantGroups: StudyGroup[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useUserGroups = (options: UseUserGroupsOptions = {}): UseUserGroupsReturn => {
  const { onAdminTransferRequested } = options;
  const currentUserId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const groupsRef = useRef<StudyGroup[]>([]);
  const socketRef = useRef<Socket | null>(null);
  // Keep callback in a ref so the socket effect closure stays stable
  const onAdminTransferRequestedRef = useRef(onAdminTransferRequested);

  // Keep callback ref in sync
  useEffect(() => { onAdminTransferRequestedRef.current = onAdminTransferRequested; }, [onAdminTransferRequested]);

  /**
   * Used only in the realtime update handler to preserve the subject when
   * merging a live getGroup() response that may not include subject.
   */
  const preserveSubject = useCallback((incoming: StudyGroup, existing: StudyGroup): StudyGroup => {
    if (incoming.subject?.name) return incoming;
    if (existing.subject?.name) return { ...incoming, subject: existing.subject };
    return incoming;
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

    // /my-groups already returns subject, members, is_admin, is_member — no extra calls needed.
    setGroups(response.data);
    setLoading(false);
  }, [token]);

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

      // Re-sync with backend detail so cards also reflect latest data if changed.
      void (async () => {
        const detailResponse = await groupsHttpService.getGroup(payload.groupId, token);
        if (!detailResponse.success || !detailResponse.data) return;
        const detailGroup = detailResponse.data;

        setGroups((currentGroups) =>
          currentGroups.map((group) => {
            if (group.id !== payload.groupId) return group;
            // Preserve subject from existing group if detail response doesn't include it
            return preserveSubject(
              { ...group, ...detailGroup, is_admin: group.is_admin, is_member: group.is_member },
              group,
            );
          }),
        );
      })();
    };

    const handleAdminTransferRequested = (payload: AdminTransferRequestedPayload) => {
      // Only notify if this socket's user is the intended recipient
      if (payload.toUserId !== currentUserId) return;
      onAdminTransferRequestedRef.current?.(payload);
    };

    socket.on('connect', joinKnownGroups);
    socket.on('study-group:updated', handleStudyGroupUpdated);
    socket.on('admin_transfer_requested', handleAdminTransferRequested);

    if (socket.connected) {
      joinKnownGroups();
    }

    return () => {
      for (const group of groupsRef.current) {
        socket.emit('study-group:leave', { groupId: group.id });
      }
      socket.off('connect', joinKnownGroups);
      socket.off('study-group:updated', handleStudyGroupUpdated);
      socket.off('admin_transfer_requested', handleAdminTransferRequested);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, preserveSubject, token]);

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
