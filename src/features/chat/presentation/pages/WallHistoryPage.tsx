import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuthStore } from '@shared/store/authStore';
import { Button } from '@shared/components/ui/Button';
import { Card } from '@shared/components/ui/Card';
import { wallSocket } from '../../infrastructure/wallSocketService';
import { wallHttpService, normalizeWallPost } from '../../infrastructure/wallHttpService';
import { WallPostCard } from '../components/WallPostCard';
import { useWallHistory } from '../hooks/useWallHistory';

export function WallHistoryPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { posts, setPosts, loading, loadingMore, hasMore, error, loadMore } = useWallHistory(
    groupId ?? '',
  );

  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId || !userId) return;

    wallSocket.connect(userId);
    wallSocket.joinWall(groupId);
    wallSocket.onNewPost((post) => {
      setPosts((prev) => [...prev, normalizeWallPost(post)]);
    });

    return () => {
      wallSocket.offNewPost();
      wallSocket.leaveWall(groupId);
      wallSocket.disconnect();
    };
  }, [groupId, userId, setPosts]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending || !groupId) return;

    setSending(true);
    setSendError(null);

    const result = await wallHttpService.sendPost(groupId, trimmed);

    if (!result.success) {
      setSendError(result.error ?? 'No se pudo enviar el mensaje');
    } else {
      setContent('');
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      void handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
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
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
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
              posts.map((post) => <WallPostCard key={post.id} post={post} />)
            )}

            <div ref={bottomRef} />
          </div>

          <div className="rounded-xl border border-ink-100 bg-white p-3">
            {sendError && (
              <p className="mb-2 text-xs font-medium text-red-600">{sendError}</p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje... (Ctrl+Enter para enviar)"
                rows={2}
                className="flex-1 resize-none rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <Button
                onClick={() => void handleSend()}
                disabled={sending || !content.trim()}
                className="flex-shrink-0"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
