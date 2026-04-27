import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import type { StudyGroup } from '../../domain/groups';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';

interface UseUserGroupsReturn {
  adminGroups: StudyGroup[];
  participantGroups: StudyGroup[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useUserGroups = (): UseUserGroupsReturn => {
  const token = useAuthStore((state) => state.token);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    setGroups(response.data);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const adminGroups = useMemo(() => groups.filter((group) => group.is_admin), [groups]);
  const participantGroups = useMemo(() => groups.filter((group) => !group.is_admin), [groups]);

  return { adminGroups, participantGroups, loading, error, reload };
};
