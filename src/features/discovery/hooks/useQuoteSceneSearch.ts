import { useCallback, useEffect, useRef, useState } from 'react';
import { useGeminiCredentials } from '../../../hooks/useGeminiCredentials';
import { QuoteSceneResult, PresentationController } from '../../../services/presentationController';
import { ExternalApiService } from '../../../services/externalApiService';
import { AI_CONFIG } from '../../../constants/aiConfig';

const SEARCH_STATUS_MESSAGES = [
  'Resolviendo la frase o escena...',
  'Evaluando coincidencias estructuradas...',
  'Refinando pósters y metadatos...',
  'Consolidando ranking final...',
];

const DEBOUNCE_MS = 420;
const CACHE_TTL_MS = 10 * 60 * 1000;

interface UseQuoteSceneSearchOptions {
  count?: number;
  enabled?: boolean;
}

interface CacheEntry {
  items: QuoteSceneResult[];
  storedAt: number;
}

const quoteCache = new Map<string, CacheEntry>();

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
  return `${getDayKey()}:quote:${count}:${normalizeText(query)}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useQuoteSceneSearch(options: UseQuoteSceneSearchOptions = {}) {
  const { isReady, generateQuoteSceneMatches } = useGeminiCredentials();
  const count = options.count ?? AI_CONFIG.DEFAULT_QUOTE_SCENE_COUNT;
  const enabled = options.enabled ?? true;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuoteSceneResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [historicalContext, setHistoricalContext] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(SEARCH_STATUS_MESSAGES[0]);

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
        console.warn('[QuoteSearch] No se pudo precargar contexto histórico.', contextError);
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
          const index = SEARCH_STATUS_MESSAGES.indexOf(previous);
          return SEARCH_STATUS_MESSAGES[(index + 1) % SEARCH_STATUS_MESSAGES.length];
        });
      }, 2200);
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
    async (inputQuery: string) => {
      if (!enabled || !isReady) {
        return;
      }

      const trimmedQuery = inputQuery.trim();
      if (!trimmedQuery) {
        cancelSearch();
        setResults([]);
        setError('Escribe una frase, escena o descripción parcial para buscar coincidencias.');
        setHasSearched(false);
        setIsLoading(false);
        setIsRefining(false);
        return;
      }

      const cacheKey = buildCacheKey(trimmedQuery, count);
      const cached = quoteCache.get(cacheKey);
      if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) {
        setResults(cached.items);
        setError(null);
        setHasSearched(true);
        setIsLoading(false);
        setIsRefining(false);
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
      setLoadingMessage(SEARCH_STATUS_MESSAGES[0]);

      try {
        const phased = await PresentationController.searchByQuoteOrScenePhased(
          trimmedQuery,
          historicalContext,
          {
            count,
            signal: controller.signal,
            generateQuoteSceneMatches,
          }
        );

        if (requestId !== requestSeqRef.current || controller.signal.aborted) {
          return;
        }

        const initialResults = phased.initialResults.slice(0, count);
        setResults(initialResults);
        setHasSearched(true);
        setIsRefining(true);
        setLoadingMessage('Refinando metadatos y confianza...');

        const finalResults = await phased.enrich();
        if (requestId !== requestSeqRef.current || controller.signal.aborted) {
          return;
        }

        const limitedResults = finalResults.slice(0, count);
        const output = limitedResults.length > 0 ? limitedResults : initialResults;

        if (output.length === 0) {
          setError('Sin coincidencias claras. Prueba otra frase o agrega más contexto.');
        } else {
          setError(null);
          quoteCache.set(cacheKey, {
            items: output,
            storedAt: Date.now(),
          });
        }

        setResults(output);
      } catch (searchError) {
        if (isAbortError(searchError)) {
          return;
        }

        const message = searchError instanceof Error ? searchError.message : 'Error en búsqueda por frases.';
        console.error('[QuoteSearch] Search flow failed.', {
          message,
          query: trimmedQuery,
        });
        setError(message);
        setHasSearched(true);
      } finally {
        if (requestId === requestSeqRef.current) {
          setIsRefining(false);
          setIsLoading(false);
        }
      }
    },
    [cancelSearch, count, enabled, generateQuoteSceneMatches, historicalContext, isReady]
  );

  const search = useCallback(
    async (inputQuery: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      await runSearch(inputQuery);
    },
    [runSearch]
  );

  const scheduleSearch = useCallback(
    (inputQuery: string) => {
      if (!enabled || !isReady) {
        return;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const trimmed = inputQuery.trim();
      if (trimmed.length < 3) {
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        void runSearch(inputQuery);
      }, DEBOUNCE_MS);
    },
    [enabled, isReady, runSearch]
  );

  const clear = useCallback(() => {
    cancelSearch();
    setResults([]);
    setError(null);
    setQuery('');
    setHasSearched(false);
    setIsLoading(false);
    setIsRefining(false);
  }, [cancelSearch]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    isRefining,
    error,
    hasSearched,
    loadingMessage,
    historicalContext,
    search,
    scheduleSearch,
    cancelSearch,
    clear,
  };
}
