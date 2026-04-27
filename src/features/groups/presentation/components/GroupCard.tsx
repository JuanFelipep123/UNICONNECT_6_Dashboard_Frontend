import { Link } from 'react-router-dom';
import { Card } from '@shared/components/ui/Card';
import type { StudyGroup } from '../../domain/groups';

interface GroupCardProps {
  group: StudyGroup;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink-900">{group.name}</h3>
        <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-900">
          {group.is_admin ? 'Admin' : 'Miembro'}
        </span>
      </div>
      <p className="text-sm text-ink-700">{group.description}</p>
      <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-500">
        <span>{group.subject?.name ?? 'Sin materia'}</span>
        <span>{group.member_count ?? 0} miembros</span>
      </div>
      <Link
        to={`/groups/${group.id}`}
        className="inline-flex items-center text-sm font-semibold text-brand-700 hover:text-brand-900"
      >
        Ver detalle
      </Link>
    </Card>
  );
}
