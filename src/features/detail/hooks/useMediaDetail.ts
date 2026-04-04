import { useEffect, useState } from 'react';
import { MediaDetail, Movie } from '../../../types/movie';
import { fetchMediaDetail } from '../services/mediaDetailService';

interface UseMediaDetailState {
  detail: MediaDetail | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: UseMediaDetailState = {
  detail: null,
  loading: false,
  error: null,
};

export function useMediaDetail(movie: Movie | null) {
  const [state, setState] = useState<UseMediaDetailState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    if (!movie || !movie.tmdbId) {
      setState(INITIAL_STATE);
      return () => {
        cancelled = true;
      };
    }

    setState((previousState) => ({
      ...previousState,
      loading: true,
      error: null,
    }));

    void fetchMediaDetail(movie)
      .then((detail) => {
        if (cancelled) {
          return;
        }
        setState({
          detail,
          loading: false,
          error: null,
        });
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }
        setState({
          detail: null,
          loading: false,
          error:
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar el detalle del titulo.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [movie]);

  return state;
}
