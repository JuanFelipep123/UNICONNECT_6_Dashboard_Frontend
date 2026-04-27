import { useNavigate } from 'react-router-dom';
import { Card } from '@shared/components/ui/Card';
import { CreateGroupForm } from '../components/CreateGroupForm';
import { useCreateStudyGroup } from '../hooks/useCreateStudyGroup';
import { useUserSubjects } from '../hooks/useUserSubjects';
import type { StudyGroupCreatePayload } from '../../domain/groups';

export function CreateGroupPage() {
  const navigate = useNavigate();
  const { subjects, loading: loadingSubjects, error: subjectsError } = useUserSubjects();
  const { createGroup, isLoading, error } = useCreateStudyGroup();

  const onSubmit = async (payload: StudyGroupCreatePayload) => {
    const groupId = await createGroup(payload);
    if (groupId) {
      navigate(`/groups/${groupId}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">Crear grupo de estudio</h1>
        <p className="mt-1 text-sm text-ink-500">La UI es web, pero se conserva la logica y endpoints del backend mobile.</p>
      </div>

      <Card>
        {loadingSubjects ? (
          <p className="text-sm text-ink-700">Cargando materias...</p>
        ) : (
          <CreateGroupForm
            subjects={subjects}
            loading={isLoading}
            error={error ?? subjectsError}
            onSubmit={onSubmit}
          />
        )}
      </Card>
    </div>
  );
}
