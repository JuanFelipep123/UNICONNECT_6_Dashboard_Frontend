import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { WallPost } from '../../domain/wall';
import { wallHttpService } from '../../infrastructure/wallHttpService';

const PAGE_SIZE = 20;

const sortChronological = (posts: WallPost[]): WallPost[] =>
  [...posts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

interface UseWallHistoryReturn {
  posts: WallPost[];
  setPosts: React.Dispatch<React.SetStateAction<WallPost[]>>;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
}

export function useWallHistory(groupId: string): UseWallHistoryReturn {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oldestIdRef = useRef<string | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    oldestIdRef.current = undefined;

    const result = await wallHttpService.getWallHistory(groupId, { limit: PAGE_SIZE });

    if (!result.success || !result.data) {
      setPosts([]);
      setError(result.error ?? 'No se pudo cargar el historial');
    } else {
      const sorted = sortChronological(result.data);
      setPosts(sorted);
      setHasMore(result.data.length === PAGE_SIZE);
      oldestIdRef.current = sorted[0]?.id;
    }

    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !oldestIdRef.current) return;

    setLoadingMore(true);

    const result = await wallHttpService.getWallHistory(groupId, {
      limit: PAGE_SIZE,
      before: oldestIdRef.current,
    });

    if (result.success && result.data && result.data.length > 0) {
      const olderSorted = sortChronological(result.data);
      setPosts((prev) => [...olderSorted, ...prev]);
      setHasMore(olderSorted.length === PAGE_SIZE);
      oldestIdRef.current = olderSorted[0]?.id ?? oldestIdRef.current;
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  }, [groupId, loadingMore, hasMore]);

  return { posts, setPosts, loading, loadingMore, hasMore, error, loadMore };
}
