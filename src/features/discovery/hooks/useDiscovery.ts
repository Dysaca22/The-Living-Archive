import { useCallback, useEffect, useMemo, useState } from 'react';
import { Movie } from '../../../types/movie';
import { PresentationController } from '../../../services/presentationController';
import { ExternalApiService } from '../../../services/externalApiService';
import { AI_CONFIG } from '../../../constants/aiConfig';

const ASTRAL_MESSAGES = [
  'Consultando el archivo cinematográfico...',
  'Alineando resonancias visuales con tu búsqueda...',
  'El curador está seleccionando títulos...',
  'Analizando metadatos y contexto histórico...',
  'Sincronizando recomendaciones para ti...',
];

interface UseDiscoveryOptions {
  count?: number;
  enabled?: boolean;
}

export function useDiscovery(apiKey: string | null, isReady: boolean, options: UseDiscoveryOptions = {}) {
  const count = options.count ?? AI_CONFIG.DEFAULT_GENERAL_COUNT;
  const enabled = options.enabled ?? true;
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalContext, setHistoricalContext] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(ASTRAL_MESSAGES[0]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!enabled || !isReady) {
      return;
    }
    ExternalApiService.fetchHistoricalDailyContext().then(setHistoricalContext);
  }, [enabled, isReady]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessage((previous) => {
          const currentIndex = ASTRAL_MESSAGES.indexOf(previous);
          return ASTRAL_MESSAGES[(currentIndex + 1) % ASTRAL_MESSAGES.length];
        });
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  const performSearch = useCallback(
    async (query: string) => {
      if (!apiKey) {
        return;
      }
      if (!query.trim()) {
        setRecommendations([]);
        setHasSearched(false);
        setError('Ingresa un término para iniciar el descubrimiento.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const enrichedResults = await PresentationController.discoverCinematicResonances(
          apiKey,
          query,
          historicalContext,
          { count }
        );
        const limitedResults = enrichedResults.slice(0, count);
        if (limitedResults.length === 0) {
          setError('Tu bóveda ya contiene esos títulos. Prueba con otra búsqueda.');
        } else {
          setRecommendations(limitedResults);
        }
        setHasSearched(true);
      } catch (searchError) {
        const message = searchError instanceof Error ? searchError.message : 'Error desconocido en discovery.';
        if (message.includes('Astral Key') || message.includes('astral model') || message.includes('congested')) {
          setError(`Error de descubrimiento: ${message}`);
        } else {
          setError('Se interrumpió la conexión de descubrimiento. Verifica tu API key.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, count, historicalContext]
  );

  const clearSearchResults = useCallback(() => {
    setRecommendations([]);
    setHasSearched(false);
    setSearchQuery('');
    setError(null);
  }, []);

  const contextTerms = useMemo(() => historicalContext.split(' ').slice(0, 5).join(' '), [historicalContext]);

  return {
    searchQuery,
    setSearchQuery,
    recommendations,
    isLoading,
    error,
    setError,
    historicalContext,
    loadingMessage,
    hasSearched,
    performSearch,
    clearSearchResults,
    contextTerms,
  };
}
