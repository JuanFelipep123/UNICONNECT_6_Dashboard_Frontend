import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import type { ProfileSubject } from '../../domain/profile';
import { profileHttpService } from '../../infrastructure/profileHttpService';

export const useAvailableSubjects = (career?: string | null) => {
  const token = useAuthStore((s) => s.token);
  const [subjects, setSubjects] = useState<ProfileSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const res = await profileHttpService.getAvailableSubjects(token, { career: career ?? undefined, limit: 100 });
    setLoading(false);
    if (res.success) { setSubjects(res.data ?? []); }
    else { setError(res.error ?? 'Error cargando materias.'); }
  }, [token, career]);

  useEffect(() => { void load(); }, [load]);

  return { subjects, loading, error, reload: load };
};
