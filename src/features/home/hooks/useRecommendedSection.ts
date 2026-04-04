import { useCallback, useEffect, useState } from 'react';
import { Movie, VaultMovieRecord } from '../../../types/movie';
import { fetchPersonalizedSectionMedia } from '../services/homePersonalizedService';

export function useRecommendedSection(records: VaultMovieRecord[]) {
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const personalized = await fetchPersonalizedSectionMedia(records);
      setItems(personalized);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Error al construir recomendaciones.';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [records]);

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
