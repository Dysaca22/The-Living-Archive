import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGeminiCredentials } from '../../../hooks/useGeminiCredentials';
import { Movie } from '../../../types/movie';
import { PresentationController } from '../../../services/presentationController';
import { ExternalApiService } from '../../../services/externalApiService';
import { AI_CONFIG } from '../../../constants/aiConfig';

const ASTRAL_MESSAGES = [
  'Resolviendo la intención de tu consulta...',
  'Construyendo recomendaciones estructuradas...',
  'Refinando metadatos visuales en segundo plano...',
  'Sincronizando resultados para render fluido...',
];

const DEBOUNCE_MS = 420;
const CACHE_TTL_MS = 10 * 60 * 1000;

interface UseDiscoveryOptions {
  count?: number;
  enabled?: boolean;
}

interface CacheEntry {
  items: Movie[];
  storedAt: number;
}

const discoveryCache = new Map<string, CacheEntry>();

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildCacheKey(query: string, count: number): string {
  return `${getDayKey()}:general:${count}:${normalizeText(query)}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useDiscovery(options: UseDiscoveryOptions = {}) {
  const { isReady, generateRecommendations } = useGeminiCredentials();
  const count = options.count ?? AI_CONFIG.DEFAULT_GENERAL_COUNT;
  const enabled = options.enabled ?? true;

  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalContext, setHistoricalContext] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(ASTRAL_MESSAGES[0]);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const activeQueryKeyRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isSubscribed = true;
    ExternalApiService.fetchHistoricalDailyContext()
      .then((context) => {
        if (isSubscribed) {
          setHistoricalContext(context);
        }
      })
      .catch((contextError) => {
        console.warn('[Discovery] No se pudo precargar contexto histórico.', contextError);
      });

    return () => {
      isSubscribed = false;
    };
  }, [enabled]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessage((previous) => {
          const currentIndex = ASTRAL_MESSAGES.indexOf(previous);
          return ASTRAL_MESSAGES[(currentIndex + 1) % ASTRAL_MESSAGES.length];
        });
      }, 2600);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const cancelSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => () => cancelSearch(), [cancelSearch]);

  useEffect(() => {
    if (!enabled || !isReady) {
      cancelSearch();
      setIsLoading(false);
      setIsRefining(false);
    }
  }, [cancelSearch, enabled, isReady]);

  const runSearch = useCallback(
    async (query: string) => {
      if (!enabled || !isReady) {
        return;
      }

      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        cancelSearch();
        setRecommendations([]);
        setHasSearched(false);
        setIsLoading(false);
        setIsRefining(false);
        setError('Ingresa un término para iniciar el descubrimiento.');
        return;
      }

      const cacheKey = buildCacheKey(trimmedQuery, count);
      const cached = discoveryCache.get(cacheKey);
      if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) {
        setRecommendations(cached.items);
        setHasSearched(true);
        setIsLoading(false);
        setIsRefining(false);
        setError(null);
        setLoadingMessage('Resultados listos desde cache.');
        return;
      }

      if (activeQueryKeyRef.current === cacheKey && isLoadingRef.current) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const requestId = ++requestSeqRef.current;
      activeQueryKeyRef.current = cacheKey;

      setIsLoading(true);
      setIsRefining(false);
      setError(null);
      setLoadingMessage(ASTRAL_MESSAGES[0]);

      try {
        const phased = await PresentationController.discoverCinematicResonancesPhased(
          trimmedQuery,
          historicalContext,
          {
            count,
            signal: controller.signal,
            generateRecommendations,
          }
        );

        if (requestId !== requestSeqRef.current || controller.signal.aborted) {
          return;
        }

        const initialResults = phased.initialResults.slice(0, count);
        setRecommendations(initialResults);
        setHasSearched(true);
        setIsRefining(true);
        setLoadingMessage('Refinando pósters y metadatos...');

        const finalResults = await phased.enrich();
        if (requestId !== requestSeqRef.current || controller.signal.aborted) {
          return;
        }

        const limitedResults = finalResults.slice(0, count);
        const output = limitedResults.length > 0 ? limitedResults : initialResults;

        if (output.length === 0) {
          setError('No encontramos coincidencias relevantes. Prueba ajustando la consulta.');
        } else {
          setError(null);
          discoveryCache.set(cacheKey, {
            items: output,
            storedAt: Date.now(),
          });
        }

        setRecommendations(output);
      } catch (searchError) {
        if (isAbortError(searchError)) {
          return;
        }

        const message = searchError instanceof Error ? searchError.message : 'Error desconocido en descubrimiento.';
        console.error('[Discovery] Search flow failed.', {
          message,
          query: trimmedQuery,
        });
        setError(message || 'Se interrumpió la conexión de descubrimiento. Verifica tu clave API.');
        setHasSearched(true);
      } finally {
        if (requestId === requestSeqRef.current) {
          setIsRefining(false);
          setIsLoading(false);
        }
      }
    },
    [cancelSearch, count, enabled, generateRecommendations, historicalContext, isReady]
  );

  const performSearch = useCallback(async (query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await runSearch(query);
  }, [runSearch]);

  const scheduleSearch = useCallback(
    (query: string) => {
      if (!enabled || !isReady) {
        return;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const trimmed = query.trim();
      if (trimmed.length < 3) {
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        void runSearch(query);
      }, DEBOUNCE_MS);
    },
    [enabled, isReady, runSearch]
  );

  const clearSearchResults = useCallback(() => {
    cancelSearch();
    setRecommendations([]);
    setHasSearched(false);
    setSearchQuery('');
    setError(null);
    setIsLoading(false);
    setIsRefining(false);
  }, [cancelSearch]);

  const contextTerms = useMemo(() => historicalContext.split(' ').slice(0, 5).join(' '), [historicalContext]);

  return {
    searchQuery,
    setSearchQuery,
    recommendations,
    isLoading,
    isRefining,
    error,
    setError,
    historicalContext,
    loadingMessage,
    hasSearched,
    performSearch,
    scheduleSearch,
    cancelSearch,
    clearSearchResults,
    contextTerms,
  };
}
