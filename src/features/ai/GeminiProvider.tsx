import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MovieRecommendation, QuoteSceneRecommendation } from '../../schemas/movieSchema';

const STORAGE_KEY = 'the_living_archive_gemini_key';

export type GeminiValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

interface GeminiGenerationOptions {
  count?: number;
}

export interface GeminiContextValue {
  apiKey: string | null;
  isReady: boolean;
  validationStatus: GeminiValidationStatus;
  validationError: string | null;
  saveKey: (key: string) => void;
  clearKey: () => void;
  validateKey: () => Promise<boolean>;
  generateRecommendations: (
    userPrompt: string,
    historicalContext: string,
    existingTitles: string[],
    options?: GeminiGenerationOptions
  ) => Promise<MovieRecommendation>;
  generateQuoteSceneMatches: (
    userPrompt: string,
    historicalContext: string,
    existingTitles: string[],
    options?: GeminiGenerationOptions
  ) => Promise<QuoteSceneRecommendation>;
}

export const GeminiContext = createContext<GeminiContextValue | null>(null);

function isGeminiFlowLike(error: unknown): error is { code: string; message: string } {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { code?: unknown; message?: unknown };
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}

function readStoredApiKey(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw && raw.trim() ? raw.trim() : null;
}

export function GeminiProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(() => readStoredApiKey());
  const [validationStatus, setValidationStatus] = useState<GeminiValidationStatus>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const validationSequenceRef = useRef(0);

  const isReady = Boolean(apiKey) && validationStatus !== 'invalid';

  const validateCandidateKey = useCallback(async (candidateKey: string): Promise<boolean> => {
    const trimmedKey = candidateKey.trim();
    if (!trimmedKey) {
      setValidationStatus('idle');
      setValidationError(null);
      return false;
    }

    const sequence = ++validationSequenceRef.current;
    setValidationStatus('validating');
    setValidationError(null);

    try {
      const { GeminiService } = await import('../../services/geminiService');
      await GeminiService.validateApiKey(trimmedKey);
      if (sequence === validationSequenceRef.current) {
        setValidationStatus('valid');
        setValidationError(null);
      }
      console.info('[GeminiBootstrap] API key validada correctamente.');
      return true;
    } catch (error) {
      const normalizedError = isGeminiFlowLike(error)
        ? error
        : { code: 'unknown', message: 'No se pudo validar la clave de Gemini.' };

      if (sequence === validationSequenceRef.current) {
        const isInvalidKey =
          normalizedError.code === 'unauthorized' || normalizedError.code === 'model_unavailable';
        setValidationStatus(isInvalidKey ? 'invalid' : 'idle');
        setValidationError(normalizedError.message);
      }

      console.warn('[GeminiBootstrap] Fallo validando API key.', {
        code: normalizedError.code,
        message: normalizedError.message,
      });
      return false;
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      const nextKey = event.newValue && event.newValue.trim() ? event.newValue.trim() : null;
      setApiKey(nextKey);
      setValidationStatus('idle');
      setValidationError(null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setValidationStatus('idle');
      setValidationError(null);
      return;
    }

    void validateCandidateKey(apiKey);
  }, [apiKey, validateCandidateKey]);

  const saveKey = useCallback((key: string) => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, trimmedKey);
    setApiKey(trimmedKey);
    setValidationStatus('idle');
    setValidationError(null);
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
    setValidationStatus('idle');
    setValidationError(null);
  }, []);

  const validateKey = useCallback(async () => {
    if (!apiKey) {
      setValidationStatus('idle');
      setValidationError('Aún no has configurado una API key de Gemini.');
      return false;
    }
    return validateCandidateKey(apiKey);
  }, [apiKey, validateCandidateKey]);

  const generateRecommendations = useCallback<GeminiContextValue['generateRecommendations']>(
    async (userPrompt, historicalContext, existingTitles, options) => {
      if (!apiKey) {
        throw new Error('Gemini no está configurado.');
      }
      const { GeminiService } = await import('../../services/geminiService');
      return GeminiService.generateRecommendations(apiKey, userPrompt, historicalContext, existingTitles, options);
    },
    [apiKey]
  );

  const generateQuoteSceneMatches = useCallback<GeminiContextValue['generateQuoteSceneMatches']>(
    async (userPrompt, historicalContext, existingTitles, options) => {
      if (!apiKey) {
        throw new Error('Gemini no está configurado.');
      }
      const { GeminiService } = await import('../../services/geminiService');
      return GeminiService.generateQuoteSceneMatches(apiKey, userPrompt, historicalContext, existingTitles, options);
    },
    [apiKey]
  );

  const value = useMemo<GeminiContextValue>(
    () => ({
      apiKey,
      isReady,
      validationStatus,
      validationError,
      saveKey,
      clearKey,
      validateKey,
      generateRecommendations,
      generateQuoteSceneMatches,
    }),
    [
      apiKey,
      isReady,
      validationStatus,
      validationError,
      saveKey,
      clearKey,
      validateKey,
      generateRecommendations,
      generateQuoteSceneMatches,
    ]
  );

  return <GeminiContext.Provider value={value}>{children}</GeminiContext.Provider>;
}
