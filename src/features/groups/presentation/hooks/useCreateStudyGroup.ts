import { useState } from 'react';
import { useAuthStore } from '@shared/store/authStore';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';
import type { StudyGroupCreatePayload } from '../../domain/groups';

interface UseCreateStudyGroupReturn {
  isLoading: boolean;
  error: string | null;
  createGroup: (payload: StudyGroupCreatePayload) => Promise<string | null>;
  clearError: () => void;
}

/**
 * Translates known backend error messages to user-friendly Spanish strings.
 * Add more cases here as the API evolves.
 */
const translateApiError = (raw: string): string => {
  const lower = raw.toLowerCase();

  if (lower.includes('maximum') && lower.includes('3') && lower.includes('study group')) {
    return 'Esta materia ya tiene el máximo de 3 grupos de estudio permitidos. Intenta con otra materia o únete a un grupo existente.';
  }

  if (lower.includes('maximum') && lower.includes('study group')) {
    return 'Se alcanzó el límite máximo de grupos de estudio para esta materia.';
  }

  return raw;
};

export const useCreateStudyGroup = (): UseCreateStudyGroupReturn => {
  const token = useAuthStore((state) => state.token);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (payload: StudyGroupCreatePayload): Promise<string | null> => {
    if (!payload.name.trim() || !payload.description.trim() || !payload.subject_id.trim()) {
      setError('Completa nombre, descripción y materia.');
      return null;
    }

    setError(null);
    setIsLoading(true);

    const response = await groupsHttpService.createGroup(payload, token);

    setIsLoading(false);

    if (!response.success || !response.data) {
      setError(translateApiError(response.error ?? 'No se pudo crear el grupo.'));
      return null;
    }

    return response.data.id ?? null;
  };

  return { isLoading, error, createGroup, clearError: () => setError(null) };
};
