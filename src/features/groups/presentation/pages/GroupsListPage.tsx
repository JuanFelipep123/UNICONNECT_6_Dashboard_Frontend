import { Link } from 'react-router-dom';
import { Button } from '@shared/components/ui/Button';
import { Card } from '@shared/components/ui/Card';
import { GroupCard } from '../components/GroupCard';
import { useUserGroups } from '../hooks/useUserGroups';

export function GroupsListPage() {
  const { adminGroups, participantGroups, loading, error } = useUserGroups();

  if (loading) {
    return <p className="text-sm text-ink-700">Cargando grupos...</p>;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Grupos de estudio</h1>
          <p className="mt-1 text-sm text-ink-500">Gestiona tus grupos y revisa actividad de participantes.</p>
        </div>
        <Link to="/groups/create">
          <Button>Nuevo grupo</Button>
        </Link>
      </section>

      {error ? <Card className="text-sm font-medium text-red-600">{error}</Card> : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink-900">Grupos administrados ({adminGroups.length})</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink-900">Grupos donde participas ({participantGroups.length})</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {participantGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </section>
    </div>
  );
}
