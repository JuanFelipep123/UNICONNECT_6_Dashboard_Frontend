import { useCallback, useEffect, useState } from 'react';
import type { WallInboxItem } from '../../domain/wall';
import { wallHttpService } from '../../infrastructure/wallHttpService';

interface UseWallInboxReturn {
  items: WallInboxItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useWallInbox(): UseWallInboxReturn {
  const [items, setItems] = useState<WallInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await wallHttpService.getWalls();

    if (!result.success || !result.data) {
      setItems([]);
      setError(result.error ?? 'No se pudo cargar la bandeja de entrada');
    } else {
      setItems(result.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}
