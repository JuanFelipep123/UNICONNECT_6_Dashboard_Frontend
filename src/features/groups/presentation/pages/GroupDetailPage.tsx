import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@shared/components/ui/Card';
import { useAuthStore } from '@shared/store/authStore';
import type { StudyGroup } from '../../domain/groups';
import { groupsHttpService } from '../../infrastructure/groupsHttpService';

export function GroupDetailPage() {
  const { groupId = '' } = useParams();
  const token = useAuthStore((state) => state.token);
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token || !groupId) {
        setError('Sesion invalida o grupo inexistente.');
        setLoading(false);
        return;
      }

      const response = await groupsHttpService.getGroup(groupId, token);
      if (!response.success || !response.data) {
        setError(response.error ?? 'No se pudo cargar el grupo.');
        setLoading(false);
        return;
      }

      setGroup(response.data);
      setLoading(false);
    };

    void load();
  }, [groupId, token]);

  if (loading) {
    return <p className="text-sm text-ink-700">Cargando detalle...</p>;
  }

  if (error || !group) {
    return <Card className="text-sm font-medium text-red-600">{error ?? 'No se encontró el grupo.'}</Card>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-ink-900">{group.name}</h1>
      <Card className="space-y-3">
        <p className="text-sm text-ink-700">{group.description}</p>
        <p className="text-sm text-ink-500">Materia: {group.subject?.name ?? 'Sin materia'}</p>
        <p className="text-sm text-ink-500">Miembros: {group.member_count ?? 0}</p>
        <p className="text-sm text-ink-500">Administrador: {group.is_admin ? 'Si' : 'No'}</p>
      </Card>
    </div>
  );
}
