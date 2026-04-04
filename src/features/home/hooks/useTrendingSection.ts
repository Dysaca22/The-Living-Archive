import { useCallback, useEffect, useState } from 'react';
import { Movie } from '../../../types/movie';
import { fetchTrendingSectionMedia } from '../services/homeTmdbService';

export function useTrendingSection() {
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await fetchTrendingSectionMedia();
      setItems(content);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Error al cargar tendencias.';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items,
    loading,
    error,
    reload,
  };
}
