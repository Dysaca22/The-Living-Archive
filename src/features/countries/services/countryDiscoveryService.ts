import { Movie } from '../../../types/movie';
import { withSimpleCache } from '../../home/services/homeCache';
import { CountryConfig } from '../config/countryConfig';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const CACHE_TTL_MS = 10 * 60 * 1000;

type TmdbMediaType = 'movie' | 'tv';

interface TmdbListItem {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
}

interface TmdbListResponse {
  results?: TmdbListItem[];
}

export type CountryDiscoverySource = 'origin_country' | 'text_fallback';

export interface CountryDiscoveryResult {
  items: Movie[];
  source: CountryDiscoverySource;
}

function parseYear(rawDate: string | undefined): number {
  if (!rawDate) {
    return new Date().getFullYear();
  }

  const year = Number.parseInt(rawDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function mapItemToMovie(item: TmdbListItem, fallbackMediaType: TmdbMediaType, context: string): Movie | null {
  const mediaType =
    item.media_type === 'movie' || item.media_type === 'tv'
      ? item.media_type
      : fallbackMediaType;

  if (item.media_type === 'person') {
    return null;
  }

  const title = mediaType === 'tv' ? item.name : item.title;
  if (!title) {
    return null;
  }

  return {
    title,
    releaseYear: mediaType === 'tv' ? parseYear(item.first_air_date) : parseYear(item.release_date),
    mediaType,
    tmdbId: item.id,
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : undefined,
    backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${item.backdrop_path}` : undefined,
    narrativeJustification: (item.overview || '').trim() || context,
  };
}

function deduplicateMovies(items: Movie[]): Movie[] {
  const uniqueItems: Movie[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const identity =
      typeof item.tmdbId === 'number'
        ? `tmdb:${item.tmdbId}`
        : `${item.mediaType}:${item.title.toLowerCase().trim()}:${item.releaseYear}`;

    if (seen.has(identity)) {
      continue;
    }

    seen.add(identity);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

async function readApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      return payload.error;
    }
  } catch (error) {
    console.error('Could not parse API error payload:', error);
  }

  return `TMDB request failed (${response.status}).`;
}

async function fetchTmdbList(endpoint: string, fallbackMediaType: TmdbMediaType, context: string): Promise<Movie[]> {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const payload = (await response.json()) as TmdbListResponse;
  const results = payload.results ?? [];

  return results
    .map((item) => mapItemToMovie(item, fallbackMediaType, context))
    .filter((item): item is Movie => Boolean(item));
}

async function discoverByOriginCountry(mediaType: TmdbMediaType, countryCode: string): Promise<Movie[]> {
  const cacheKey = `countries:discover:${mediaType}:${countryCode}`;
  const context =
    mediaType === 'movie'
      ? `Descubrimiento por pais de origen (${countryCode}).`
      : `Series por pais de origen (${countryCode}).`;
  const endpoint = `/api/tmdb/discover/${mediaType}?with_origin_country=${countryCode}&sort_by=popularity.desc&vote_count.gte=60&include_adult=false`;

  return withSimpleCache(cacheKey, CACHE_TTL_MS, async () => fetchTmdbList(endpoint, mediaType, context));
}

async function searchFallbackByCountry(country: CountryConfig): Promise<Movie[]> {
  const fallbackQueries = [country.fallbackQuery, `movies from ${country.mapName}`];

  for (const query of fallbackQueries) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      continue;
    }

    const cacheKey = `countries:fallback:${country.countryCode}:${trimmedQuery.toLowerCase()}`;
    const endpoint = `/api/tmdb/search/multi?query=${encodeURIComponent(trimmedQuery)}`;
    const context = `Resultados por texto vinculados con ${country.label}.`;

    const items = await withSimpleCache(cacheKey, CACHE_TTL_MS, async () =>
      fetchTmdbList(endpoint, 'movie', context)
    );

    if (items.length > 0) {
      return items;
    }
  }

  return [];
}

export async function discoverMediaByCountry(country: CountryConfig): Promise<CountryDiscoveryResult> {
  const [movieItems, tvItems] = await Promise.all([
    discoverByOriginCountry('movie', country.countryCode).catch(() => []),
    discoverByOriginCountry('tv', country.countryCode).catch(() => []),
  ]);

  const primaryItems = deduplicateMovies([...movieItems, ...tvItems]).slice(0, 18);
  if (primaryItems.length > 0) {
    return {
      items: primaryItems,
      source: 'origin_country',
    };
  }

  const fallbackItems = deduplicateMovies(await searchFallbackByCountry(country)).slice(0, 18);
  return {
    items: fallbackItems,
    source: 'text_fallback',
  };
}
