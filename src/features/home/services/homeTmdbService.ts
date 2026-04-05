import { Movie } from '../../../types/movie';
import { withSimpleCache } from './homeCache';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const CACHE_TTL_MS = 10 * 60 * 1000;

type TmdbMediaType = 'movie' | 'tv';
type SeasonBucket = 'verano' | 'otono' | 'invierno' | 'primavera';

interface TmdbListItem {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbDetailsResponse {
  genres?: TmdbGenre[];
}

interface TmdbListResponse {
  results?: TmdbListItem[];
}

interface ApiErrorPayload {
  error?: string;
}

interface SeasonalProfile {
  bucket: SeasonBucket;
  title: string;
  subtitle: string;
  movieGenres: string;
  tvGenres: string;
}

const SEASONAL_PROFILES: Record<number, SeasonalProfile> = {
  1: {
    bucket: 'verano',
    title: 'Filmes para enero',
    subtitle: 'Historias familiares y de aventura para abrir el ano.',
    movieGenres: '12,35,10751',
    tvGenres: '35,10759,10765',
  },
  2: {
    bucket: 'verano',
    title: 'Filmes para febrero',
    subtitle: 'Romance y peliculas luminosas para mitad de temporada.',
    movieGenres: '10749,35,18',
    tvGenres: '18,35,10766',
  },
  3: {
    bucket: 'otono',
    title: 'Filmes para marzo',
    subtitle: 'Dramas de transicion y relatos de reinicio.',
    movieGenres: '18,10402,10749',
    tvGenres: '18,9648,10766',
  },
  4: {
    bucket: 'otono',
    title: 'Filmes para abril',
    subtitle: 'Cine de autor y emociones de media estacion.',
    movieGenres: '18,99,10749',
    tvGenres: '18,99,9648',
  },
  5: {
    bucket: 'otono',
    title: 'Filmes para mayo',
    subtitle: 'Historias contemplativas y de crecimiento personal.',
    movieGenres: '18,36,10752',
    tvGenres: '18,80,99',
  },
  6: {
    bucket: 'invierno',
    title: 'Filmes para junio',
    subtitle: 'Accion y ciencia ficcion para noches largas.',
    movieGenres: '28,878,12',
    tvGenres: '10759,10765,9648',
  },
  7: {
    bucket: 'invierno',
    title: 'Filmes para julio',
    subtitle: 'Blockbusters y aventura de alto ritmo.',
    movieGenres: '28,12,53',
    tvGenres: '10759,18,10765',
  },
  8: {
    bucket: 'invierno',
    title: 'Filmes para agosto',
    subtitle: 'Thrillers y fantasia para cierre de temporada fria.',
    movieGenres: '53,14,9648',
    tvGenres: '9648,80,10759',
  },
  9: {
    bucket: 'primavera',
    title: 'Filmes para septiembre',
    subtitle: 'Nuevos comienzos con drama y misterio.',
    movieGenres: '18,9648,99',
    tvGenres: '18,9648,99',
  },
  10: {
    bucket: 'primavera',
    title: 'Filmes para octubre',
    subtitle: 'Temporada de suspenso y horror de autor.',
    movieGenres: '27,53,9648',
    tvGenres: '9648,80,18',
  },
  11: {
    bucket: 'primavera',
    title: 'Filmes para noviembre',
    subtitle: 'Cierre emocional con cine dramatico y documental.',
    movieGenres: '18,99,10752',
    tvGenres: '18,99,80',
  },
  12: {
    bucket: 'verano',
    title: 'Filmes para diciembre',
    subtitle: 'Seleccion festiva, familiar y de aventura.',
    movieGenres: '10751,35,12',
    tvGenres: '10766,35,10759',
  },
};

function getProfileForMonth(month: number): SeasonalProfile {
  return SEASONAL_PROFILES[month] ?? SEASONAL_PROFILES[1];
}

function sanitizeYear(rawDate: string | undefined): number {
  if (!rawDate) {
    return new Date().getFullYear();
  }
  const year = Number.parseInt(rawDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function toMovie(item: TmdbListItem, fallbackMediaType: TmdbMediaType, context: string): Movie | null {
  const mediaType = item.media_type === 'tv' || item.media_type === 'movie' ? item.media_type : fallbackMediaType;
  if (item.media_type === 'person') {
    return null;
  }

  const title = mediaType === 'tv' ? item.name : item.title;
  if (!title) {
    return null;
  }

  const releaseYear = mediaType === 'tv' ? sanitizeYear(item.first_air_date) : sanitizeYear(item.release_date);
  const overview = (item.overview || '').trim();

  return {
    title,
    releaseYear,
    mediaType,
    tmdbId: item.id,
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : undefined,
    backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${item.backdrop_path}` : undefined,
    narrativeJustification: overview || context,
  };
}

async function readApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // ignore JSON parse failures for error payloads
  }

  return `TMDB respondio con estado ${response.status}.`;
}

async function fetchTmdbList(
  cacheKey: string,
  endpoint: string,
  fallbackMediaType: TmdbMediaType,
  context: string
): Promise<Movie[]> {
  return withSimpleCache(cacheKey, CACHE_TTL_MS, async () => {
    const response = await fetch(endpoint);
    if (!response.ok) {
      const errorMessage = await readApiError(response);
      if (response.status === 503) {
        throw new Error(
          `${errorMessage} Configura TMDB_READ_ACCESS_TOKEN en tu archivo .env y reinicia npm run dev.`
        );
      }
      throw new Error(errorMessage);
    }

    const payload = (await response.json()) as TmdbListResponse;
    const results = payload.results ?? [];
    return results
      .map((item) => toMovie(item, fallbackMediaType, context))
      .filter((item): item is Movie => Boolean(item))
      .slice(0, 12);
  });
}

export async function fetchTrendingSectionMedia(): Promise<Movie[]> {
  return fetchTmdbList(
    'home:trending:all:week',
    '/api/tmdb/trending/all/week',
    'movie',
    'Contenido en tendencia global esta semana.'
  );
}

export async function fetchSeasonalSectionMedia(date: Date): Promise<{ title: string; subtitle: string; items: Movie[] }> {
  const month = date.getMonth() + 1;
  const profile = getProfileForMonth(month);

  const [movieItems, tvItems] = await Promise.all([
    fetchTmdbList(
      `home:seasonal:movie:${month}`,
      `/api/tmdb/discover/movie?with_genres=${profile.movieGenres}&sort_by=popularity.desc&vote_count.gte=200`,
      'movie',
      `Seleccion estacional (${profile.bucket}) para el mes actual.`
    ),
    fetchTmdbList(
      `home:seasonal:tv:${month}`,
      `/api/tmdb/discover/tv?with_genres=${profile.tvGenres}&sort_by=popularity.desc&vote_count.gte=150`,
      'tv',
      `Series alineadas con la temporada (${profile.bucket}) del mes actual.`
    ),
  ]);

  const items = [...movieItems.slice(0, 6), ...tvItems.slice(0, 6)].slice(0, 12);
  return {
    title: profile.title,
    subtitle: profile.subtitle,
    items,
  };
}

export async function searchMediaByTextQuery(query: string, cachePrefix = 'home:query'): Promise<Movie[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }
  return fetchTmdbList(
    `${cachePrefix}:${trimmedQuery.toLowerCase()}`,
    `/api/tmdb/search/multi?query=${encodeURIComponent(trimmedQuery)}`,
    'movie',
    `Resultados asociados a "${trimmedQuery}".`
  );
}

export async function discoverMediaByGenres(
  mediaType: TmdbMediaType,
  genreIds: number[],
  cachePrefix: string,
  context: string
): Promise<Movie[]> {
  if (genreIds.length === 0) {
    return [];
  }
  const genreParam = genreIds.join(',');
  return fetchTmdbList(
    `${cachePrefix}:${mediaType}:${genreParam}`,
    `/api/tmdb/discover/${mediaType}?with_genres=${genreParam}&sort_by=popularity.desc&vote_count.gte=120`,
    mediaType,
    context
  );
}

export async function fetchGenresForMedia(mediaType: TmdbMediaType, tmdbId: number): Promise<number[]> {
  return withSimpleCache(`home:detail:${mediaType}:${tmdbId}`, CACHE_TTL_MS, async () => {
    const response = await fetch(`/api/tmdb/${mediaType}/${tmdbId}`);
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as TmdbDetailsResponse;
    return (payload.genres ?? []).map((genre) => genre.id);
  });
}
