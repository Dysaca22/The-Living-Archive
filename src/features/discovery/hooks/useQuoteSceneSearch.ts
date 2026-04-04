import { useCallback, useEffect, useState } from 'react';
import { QuoteSceneResult, PresentationController } from '../../../services/presentationController';
import { ExternalApiService } from '../../../services/externalApiService';
import { AI_CONFIG } from '../../../constants/aiConfig';

const SEARCH_STATUS_MESSAGES = [
  'Analizando frase y contexto...',
  'Buscando coincidencias de escena...',
  'Contrastando candidatos en catalogo...',
  'Ajustando nivel de confianza...',
];

interface UseQuoteSceneSearchOptions {
  count?: number;
  enabled?: boolean;
}

export function useQuoteSceneSearch(
  apiKey: string | null,
  isReady: boolean,
  options: UseQuoteSceneSearchOptions = {}
) {
  const count = options.count ?? AI_CONFIG.DEFAULT_QUOTE_SCENE_COUNT;
  const enabled = options.enabled ?? true;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuoteSceneResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [historicalContext, setHistoricalContext] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(SEARCH_STATUS_MESSAGES[0]);

  useEffect(() => {
    if (!enabled || !isReady) return;
    ExternalApiService.fetchHistoricalDailyContext().then(setHistoricalContext);
  }, [enabled, isReady]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessage((previous) => {
          const index = SEARCH_STATUS_MESSAGES.indexOf(previous);
          return SEARCH_STATUS_MESSAGES[(index + 1) % SEARCH_STATUS_MESSAGES.length];
        });
      }, 2500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const search = useCallback(
    async (inputQuery: string) => {
      if (!apiKey) return;
      if (!inputQuery.trim()) {
        setResults([]);
        setError('Escribe una frase, escena o descripcion parcial para buscar coincidencias.');
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const rawResults = await PresentationController.searchByQuoteOrScene(
          apiKey,
          inputQuery,
          historicalContext,
          { count }
        );
        setResults(rawResults);
        setHasSearched(true);
      } catch (searchError) {
        const message = searchError instanceof Error ? searchError.message : 'Error en busqueda por frases.';
        setError(message);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, count, historicalContext]
  );

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    setQuery('');
    setHasSearched(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasSearched,
    loadingMessage,
    historicalContext,
    search,
    clear,
  };
}
