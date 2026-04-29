import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@shared/components/ui/Button';
import { Card } from '@shared/components/ui/Card';
import { WallPostCard } from '../components/WallPostCard';
import { useWallHistory } from '../hooks/useWallHistory';

export function WallHistoryPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { posts, loading, loadingMore, hasMore, error, loadMore } = useWallHistory(groupId ?? '');

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-1 text-ink-500 hover:bg-ink-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-ink-900">Muro del grupo</h1>
      </div>

      {error ? (
        <Card className="text-sm font-medium text-red-600">{error}</Card>
      ) : loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-ink-100" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </Button>
            </div>
          )}

          {posts.length === 0 ? (
            <Card className="py-12 text-center text-sm text-ink-500">
              Sé el primero en publicar en este grupo.
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <WallPostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <div className="mt-auto rounded-xl border border-ink-100 bg-white p-4">
            <p className="text-sm text-ink-400">Escribe un mensaje... (próximamente)</p>
          </div>
        </>
      )}
    </div>
  );
}
