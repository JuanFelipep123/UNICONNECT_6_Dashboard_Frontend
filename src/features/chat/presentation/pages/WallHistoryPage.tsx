import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@shared/store/authStore';
import { Card } from '@shared/components/ui/Card';
import { wallSocket } from '../../infrastructure/wallSocketService';
import { normalizeWallPost } from '../../infrastructure/wallHttpService';
import { WallPostWithAttachments } from '../components/WallPostWithAttachments';
import { WallPostInput } from '../components/WallPostInput';
import { useWallHistory } from '../hooks/useWallHistory';

export function WallHistoryPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);

  const { posts, setPosts, loading, loadingMore, hasMore, error, loadMore } = useWallHistory(
    groupId ?? '',
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);

  // Socket lifecycle
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

  // Scroll management: bottom on new post, position restore on load more
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isLoadingMoreRef.current) {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      isLoadingMoreRef.current = false;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  // Infinite scroll: trigger loadMore when user scrolls near the top
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || loadingMore || !hasMore) return;

    if (container.scrollTop <= 80) {
      prevScrollHeightRef.current = container.scrollHeight;
      isLoadingMoreRef.current = true;
      void loadMore();
    }
  }, [loadingMore, hasMore, loadMore]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header — always visible */}
      <div className="flex flex-shrink-0 items-center gap-3">
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
          {/* Scrollable messages — fills remaining space */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pr-1"
          >
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 size={18} className="animate-spin text-ink-400" />
              </div>
            )}

            <div className="space-y-6 pb-2">
              {posts.length === 0 ? (
                <Card className="py-12 text-center text-sm text-ink-500">
                  Sé el primero en publicar en este grupo.
                </Card>
              ) : (
                posts.map((post) => <WallPostWithAttachments key={post.id} post={post} />)
              )}
            </div>
          </div>

          {/* Input — always pinned at bottom */}
          <div className="flex-shrink-0">
            {groupId && <WallPostInput groupId={groupId} />}
          </div>
        </>
      )}
    </div>
  );
}
