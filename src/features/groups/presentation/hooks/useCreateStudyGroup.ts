import { useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';
import type { StudyGroupCreatePayload } from '../../domain/groups';

interface UseCreateStudyGroupReturn {
  isLoading: boolean;
  error: string | null;
  createGroup: (payload: StudyGroupCreatePayload) => Promise<string | null>;
}

export const useCreateStudyGroup = (): UseCreateStudyGroupReturn => {
  const token = useAuthStore((state) => state.token);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (payload: StudyGroupCreatePayload): Promise<string | null> => {
    if (!payload.name.trim() || !payload.description.trim() || !payload.subject_id.trim()) {
      setError('Completa nombre, descripcion y materia.');
      return null;
    }

    setError(null);
    setIsLoading(true);

    const response = await groupsHttpService.createGroup(payload, token);

    setIsLoading(false);

    if (!response.success || !response.data) {
      setError(response.error ?? 'No se pudo crear el grupo.');
      return null;
    }

    return response.data.id ?? null;
  };

  return { isLoading, error, createGroup };
};
