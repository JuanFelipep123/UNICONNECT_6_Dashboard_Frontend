import { useCallback, useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import type { StudyGroup, Subject } from '../../domain/groups';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';
import { subjectsHttpService } from '../../infrastructure/subjectsHttpService';

export type GroupSearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface UseGroupSearchReturn {
  subjects: Subject[];
  selectedSubject: Subject | null;
  groups: StudyGroup[];
  loadingSubjects: boolean;
  subjectsError: string | null;
  status: GroupSearchStatus;
  error: string | null;
  loadSubjects: () => Promise<Subject[]>;
  selectSubject: (subject: Subject | null) => void;
  searchGroups: (subjectId: string) => Promise<void>;
  resetResults: () => void;
  joinGroup: (groupId: string) => Promise<{ success: boolean; pending?: boolean; error?: string }>;
}

export const useGroupSearch = (): UseGroupSearchReturn => {
  const token = useAuthStore((state) => state.token);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [status, setStatus] = useState<GroupSearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async (): Promise<Subject[]> => {
    setLoadingSubjects(true);
    setSubjectsError(null);

    const response = await subjectsHttpService.getUserSubjects(token);

    if (!response.success || !response.data) {
      setSubjects([]);
      setSubjectsError(response.error ?? 'No se pudieron cargar las materias.');
      setLoadingSubjects(false);
      return [];
    }

    setSubjects(response.data);
    setLoadingSubjects(false);
    return response.data;
  }, [token]);

  const selectSubject = useCallback((subject: Subject | null) => {
    setSelectedSubject(subject);
  }, []);

  const resetResults = useCallback(() => {
    setGroups([]);
    setError(null);
    setStatus('idle');
  }, []);

  const searchGroups = useCallback(async (subjectId: string) => {
    if (!token) {
      setStatus('error');
      setError('Sesión no válida.');
      return;
    }

    setStatus('loading');
    setError(null);

    const response = await groupsHttpService.getAvailableGroupsBySubject(subjectId, token);

    if (!response.success) {
      setStatus('error');
      setError(response.error ?? 'No se pudieron cargar los grupos.');
      setGroups([]);
      return;
    }

    const data = response.data ?? [];
    setGroups(data);
    setStatus(data.length > 0 ? 'success' : 'empty');
  }, [token]);

  const joinGroup = useCallback(async (groupId: string): Promise<{ success: boolean; pending?: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Sesión no válida.' };

    const response = await groupsHttpService.joinGroup(groupId, token);

    if (!response.success) {
      // 409 with "Ya enviaste" means a pending request already exists — treat as pending
      if (response.error?.includes('Ya enviaste')) {
        return { success: true, pending: true };
      }
      return { success: false, error: response.error };
    }

    // Successful join creates a pending request (backend returns isMember: false until approved)
    return { success: true, pending: true };
  }, [token]);

  return {
    subjects,
    selectedSubject,
    groups,
    loadingSubjects,
    subjectsError,
    status,
    error,
    loadSubjects,
    selectSubject,
    searchGroups,
    resetResults,
    joinGroup,
  };
};
