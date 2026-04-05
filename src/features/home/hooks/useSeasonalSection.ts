import { useCallback, useEffect, useRef, useState } from 'react';
import { Movie } from '../../../types/movie';
import { fetchSeasonalSectionMedia } from '../services/homeTmdbService';
import { useGeminiCredentials } from '../../../hooks/useGeminiCredentials';

export function useSeasonalSection() {
  const { apiKey, isReady } = useGeminiCredentials();
  const [title, setTitle] = useState('Filmes de esta época del año');
  const [subtitle, setSubtitle] = useState('Selección curada según el momento actual.');
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const variantSeedRef = useRef(0);

  const loadSeasonalSelection = useCallback(async (variantSeed: number) => {
    setLoading(true);
    setError(null);
    try {
      const content = await fetchSeasonalSectionMedia(new Date(), {
        apiKey: isReady ? apiKey : null,
        minItems: 8,
        maxItems: 16,
        variantSeed,
      });
      setTitle(content.title);
      setSubtitle(content.subtitle);
      setItems(content.items);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar la curaduría estacional.';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiKey, isReady]);

  const reload = useCallback(async () => {
    await loadSeasonalSelection(variantSeedRef.current);
  }, [loadSeasonalSelection]);

  const regenerate = useCallback(async () => {
    variantSeedRef.current += 1;
    await loadSeasonalSelection(variantSeedRef.current);
  }, [loadSeasonalSelection]);

  useEffect(() => {
    variantSeedRef.current = 0;
    void loadSeasonalSelection(0);
  }, [loadSeasonalSelection]);

  return {
    title,
    subtitle,
    items,
    loading,
    error,
    reload,
    regenerate,
  };
}
