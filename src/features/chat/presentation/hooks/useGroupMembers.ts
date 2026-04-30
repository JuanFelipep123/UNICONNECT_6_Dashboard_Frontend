import { useEffect, useState } from 'react';
import type { GroupMember } from '../../domain/wall';
import { wallHttpService } from '../../infrastructure/wallHttpService';

interface UseGroupMembersReturn {
  members: GroupMember[];
  loading: boolean;
  error: string | null;
}

export function useGroupMembers(groupId: string): UseGroupMembersReturn {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    wallHttpService.getGroupMembers(groupId).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setMembers(result.data);
      } else {
        setError(result.error ?? 'No se pudieron cargar los miembros');
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [groupId]);

  return { members, loading, error };
}
