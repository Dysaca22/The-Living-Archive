import { useCallback, useEffect, useRef, useState } from 'react';
import { Movie } from '../../../types/movie';
import { CountryConfig } from '../config/countryConfig';
import {
  CountryDiscoverySource,
  discoverMediaByCountry,
} from '../services/countryDiscoveryService';

interface CountryDiscoveryState {
  items: Movie[];
  loading: boolean;
  error: string | null;
  source: CountryDiscoverySource | null;
}

const INITIAL_STATE: CountryDiscoveryState = {
  items: [],
  loading: false,
  error: null,
  source: null,
};

export function useCountryDiscovery(selectedCountry: CountryConfig | null) {
  const [state, setState] = useState<CountryDiscoveryState>(INITIAL_STATE);
  const [hasLoadedCountry, setHasLoadedCountry] = useState(false);
  const requestIdRef = useRef(0);

  const loadCountryDiscovery = useCallback(async (country: CountryConfig) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState((previousState) => ({
      ...previousState,
      loading: true,
      error: null,
    }));

    try {
      const result = await discoverMediaByCountry(country);
      if (requestIdRef.current !== requestId) {
        return;
      }

      setState({
        items: result.items,
        loading: false,
        error: null,
        source: result.source,
      });
    } catch (requestError) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setState({
        items: [],
        loading: false,
        error:
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo cargar descubrimiento por pais.',
        source: null,
      });
    } finally {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setHasLoadedCountry(true);
    }
  }, []);

  useEffect(() => {
    if (!selectedCountry) {
      requestIdRef.current += 1;
      setState(INITIAL_STATE);
      setHasLoadedCountry(false);
      return;
    }

    void loadCountryDiscovery(selectedCountry);
  }, [loadCountryDiscovery, selectedCountry]);

  const reload = useCallback(async () => {
    if (!selectedCountry) {
      return;
    }

    await loadCountryDiscovery(selectedCountry);
  }, [loadCountryDiscovery, selectedCountry]);

  return {
    ...state,
    hasLoadedCountry,
    reload,
  };
}
