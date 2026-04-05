import { useCallback, useEffect, useState } from 'react';
import { Movie } from '../../../types/movie';
import { CategoryDefinition } from '../config/categoryConfig';
import { CategoryDiscoveryResult, discoverCategoryContent } from '../services/categoryDiscoveryService';

interface CategoryDiscoveryState {
  items: Movie[];
  loading: boolean;
  error: string | null;
  strategyLabel: string;
}

const INITIAL_STATE: CategoryDiscoveryState = {
  items: [],
  loading: false,
  error: null,
  strategyLabel: '',
};

export function useCategoryDiscovery(category: CategoryDefinition | undefined) {
  const [state, setState] = useState<CategoryDiscoveryState>(INITIAL_STATE);

  const load = useCallback(async () => {
    if (!category) {
      setState(INITIAL_STATE);
      return;
    }

    setState((previousState) => ({
      ...previousState,
      loading: true,
      error: null,
    }));

    try {
      const result: CategoryDiscoveryResult = await discoverCategoryContent(category);
      setState({
        items: result.items,
        loading: false,
        error: null,
        strategyLabel: result.strategyLabel,
      });
    } catch (requestError) {
      setState({
        items: [],
        loading: false,
        error:
          requestError instanceof Error
            ? requestError.message
            : 'No fue posible cargar la categoria.',
        strategyLabel: category.discovery.rationale,
      });
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...state,
    reload: load,
  };
}
