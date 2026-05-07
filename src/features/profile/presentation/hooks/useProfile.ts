import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import type { ProfileData, ProfileSubject } from '../../domain/profile';
import { profileHttpService } from '../../infrastructure/profileHttpService';

export interface UseProfileReturn {
  profile: ProfileData | null;
  subjects: ProfileSubject[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  reload: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  addSubject: (subjectId: string) => Promise<boolean>;
  removeSubject: (subjectId: string) => Promise<boolean>;
  clearSaveError: () => void;
}

export const useProfile = (): UseProfileReturn => {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subjects, setSubjects] = useState<ProfileSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token || !userId) { setError('Sesión no disponible.'); setLoading(false); return; }

    setLoading(true);
    setError(null);

    const [profileRes, subjectsRes] = await Promise.all([
      profileHttpService.getProfile(userId, token),
      profileHttpService.getProfileSubjects(userId, token),
    ]);

    if (!profileRes.success) {
      setError(profileRes.error ?? 'Error cargando perfil.');
    } else {
      setProfile(profileRes.data ?? null);
    }

    if (subjectsRes.success) {
      setSubjects(subjectsRes.data ?? []);
    }

    setLoading(false);
  }, [token, userId]);

  useEffect(() => { void reload(); }, [reload]);

  const updateProfile = useCallback(async (data: Partial<ProfileData>): Promise<boolean> => {
    if (!token || !userId) { setSaveError('Sesión no disponible.'); return false; }
    setSaving(true);
    setSaveError(null);

    const res = await profileHttpService.updateProfile(userId, data, token);
    setSaving(false);

    if (!res.success) { setSaveError(res.error ?? 'Error al guardar.'); return false; }

    // Merge the update into local state
    setProfile((prev) => prev ? { ...prev, ...data, ...(res.data ?? {}) } : prev);
    return true;
  }, [token, userId]);

  const uploadAvatar = useCallback(async (file: File): Promise<boolean> => {
    if (!token || !userId) { setSaveError('Sesión no disponible.'); return false; }
    setSaving(true);
    setSaveError(null);

    const res = await profileHttpService.uploadAvatar(userId, file, token);
    if (!res.success) { setSaving(false); setSaveError(res.error ?? 'Error al subir avatar.'); return false; }

    let avatarUrl = res.data?.url || null;

    // If backend didn't return URL, re-fetch profile
    if (!avatarUrl) {
      const refreshed = await profileHttpService.getProfile(userId, token);
      if (refreshed.success && refreshed.data?.avatar_url) {
        avatarUrl = refreshed.data.avatar_url;
      }
    }

    if (avatarUrl) {
      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
    }

    setSaving(false);
    return true;
  }, [token, userId]);

  const addSubject = useCallback(async (subjectId: string): Promise<boolean> => {
    if (!token || !userId) return false;
    const res = await profileHttpService.addSubjectToProfile(userId, subjectId, token);
    if (res.success) {
      // Reload subjects to get the full list
      const subjectsRes = await profileHttpService.getProfileSubjects(userId, token);
      if (subjectsRes.success) setSubjects(subjectsRes.data ?? []);
    }
    return res.success;
  }, [token, userId]);

  const removeSubject = useCallback(async (subjectId: string): Promise<boolean> => {
    if (!token || !userId) return false;
    // Optimistic removal
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    const res = await profileHttpService.removeSubjectFromProfile(userId, subjectId, token);
    if (!res.success) {
      // Revert on failure
      const subjectsRes = await profileHttpService.getProfileSubjects(userId, token);
      if (subjectsRes.success) setSubjects(subjectsRes.data ?? []);
    }
    return res.success;
  }, [token, userId]);

  const clearSaveError = useCallback(() => setSaveError(null), []);

  return { profile, subjects, loading, error, saving, saveError, reload, updateProfile, uploadAvatar, addSubject, removeSubject, clearSaveError };
};
