import { useCallback, useEffect, useMemo, useState } from 'react';
import { Movie } from '../../../types/movie';
import { fetchSeasonalSectionMedia } from '../services/homeTmdbService';

export function useSeasonalSection() {
  const [title, setTitle] = useState('Filmes de esta epoca del ano');
  const [subtitle, setSubtitle] = useState('Seleccion curada segun el mes actual.');
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await fetchSeasonalSectionMedia(new Date());
      setTitle(content.title);
      setSubtitle(content.subtitle);
      setItems(content.items);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Error al cargar contenidos estacionales.';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, currentMonth]);

  return {
    title,
    subtitle,
    items,
    loading,
    error,
    reload,
  };
}
