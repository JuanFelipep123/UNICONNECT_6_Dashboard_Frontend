import { useNavigate } from 'react-router-dom';
import { Card } from '@shared/components/ui/Card';
import { WallInboxItemRow } from '../components/WallInboxItem';
import { useWallInbox } from '../hooks/useWallInbox';

export function WallInboxPage() {
  const { items, loading, error } = useWallInbox();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">Mensajes</h1>
        <p className="mt-1 text-sm text-ink-500">Actividad reciente en los muros de tus grupos.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      ) : error ? (
        <Card className="text-sm font-medium text-red-600">{error}</Card>
      ) : items.length === 0 ? (
        <Card className="py-12 text-center text-sm text-ink-500">
          No tienes grupos con actividad aún.
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <WallInboxItemRow
              key={item.groupId}
              item={item}
              onClick={() => navigate(`/chat/groups/${item.groupId}/wall`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
