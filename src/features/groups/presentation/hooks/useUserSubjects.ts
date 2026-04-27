import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import type { Subject } from '../../domain/groups';
import { subjectsHttpService } from '../../infrastructure/subjectsHttpService';

interface UseUserSubjectsReturn {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
}

export const useUserSubjects = (): UseUserSubjectsReturn => {
  const token = useAuthStore((state) => state.token);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await subjectsHttpService.getUserSubjects(token);

    if (!response.success || !response.data) {
      setSubjects([]);
      setError(response.error ?? 'No se pudieron cargar las materias');
      setLoading(false);
      return;
    }

    setSubjects(response.data);
    setError(null);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { subjects, loading, error };
};
