import { MediaDetail, MediaSeasonSummary, Movie, PublicReview } from '../../../types/movie';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_REVIEWS = 5;
const MAX_COLLECTION_ITEMS = 10;

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbBelongsToCollection {
  id: number;
  name: string;
}

interface TmdbSeason {
  id: number;
  name?: string;
  season_number?: number;
  episode_count?: number;
  air_date?: string;
  poster_path?: string | null;
}

interface TmdbMediaDetailResponse {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  homepage?: string;
  genres?: TmdbGenre[];
  vote_average?: number;
  vote_count?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TmdbSeason[];
  belongs_to_collection?: TmdbBelongsToCollection | null;
}

interface TmdbReviewItem {
  id: string;
  author?: string;
  content?: string;
  created_at?: string;
  url?: string;
  author_details?: {
    rating?: number | null;
  };
}

interface TmdbReviewResponse {
  results?: TmdbReviewItem[];
}

interface TmdbCollectionItem {
  id: number;
  title?: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

interface TmdbCollectionResponse {
  id: number;
  name: string;
  parts?: TmdbCollectionItem[];
}

interface CachedValue<T> {
  expiresAt: number;
  value: T;
}

const detailCache = new Map<string, CachedValue<MediaDetail>>();
const inFlightCache = new Map<string, Promise<MediaDetail>>();

function buildImageUrl(path: string | null | undefined): string | undefined {
  if (!path) {
    return undefined;
  }
  return `${TMDB_IMAGE_BASE_URL}${path}`;
}

function parseYear(rawDate: string | undefined, fallbackYear: number): number {
  if (!rawDate) {
    return fallbackYear;
  }

  const year = Number.parseInt(rawDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : fallbackYear;
}

function normalizeOverview(overview: string | undefined, fallbackText: string): string {
  const normalized = (overview || '').trim();
  return normalized || fallbackText;
}

async function readApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      return payload.error;
    }
  } catch (error) {
    console.error('No se pudo parsear error del proxy TMDB:', error);
  }
  return `TMDB proxy respondio con estado ${response.status}.`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  return (await response.json()) as T;
}

async function fetchDetailWithMediaTypeFallback(
  movie: Movie
): Promise<{ payload: TmdbMediaDetailResponse; resolvedMediaType: 'movie' | 'tv' }> {
  if (!movie.tmdbId) {
    throw new Error('Se requiere tmdbId para resolver el detalle.');
  }

  const primaryMediaType = movie.mediaType;
  const secondaryMediaType = primaryMediaType === 'movie' ? 'tv' : 'movie';

  try {
    const payload = await fetchJson<TmdbMediaDetailResponse>(`/api/tmdb/${primaryMediaType}/${movie.tmdbId}`);
    return { payload, resolvedMediaType: primaryMediaType };
  } catch (primaryError) {
    try {
      const payload = await fetchJson<TmdbMediaDetailResponse>(`/api/tmdb/${secondaryMediaType}/${movie.tmdbId}`);
      return { payload, resolvedMediaType: secondaryMediaType };
    } catch {
      throw primaryError;
    }
  }
}

function toReview(review: TmdbReviewItem): PublicReview | null {
  const id = review.id || '';
  const content = (review.content || '').trim();
  if (!id || !content) {
    return null;
  }

  return {
    id,
    author: review.author || 'Anónimo',
    content,
    createdAt: review.created_at || '',
    authorRating:
      typeof review.author_details?.rating === 'number' ? review.author_details.rating : undefined,
    url: review.url,
  };
}

function toSeasonSummary(season: TmdbSeason): MediaSeasonSummary | null {
  if (typeof season.id !== 'number') {
    return null;
  }

  return {
    id: season.id,
    seasonNumber: typeof season.season_number === 'number' ? season.season_number : 0,
    name: season.name || `Temporada ${season.season_number ?? '?'}`,
    episodeCount: typeof season.episode_count === 'number' ? season.episode_count : 0,
    airDate: season.air_date || undefined,
    posterUrl: buildImageUrl(season.poster_path),
  };
}

function toCollectionMovie(part: TmdbCollectionItem): Movie | null {
  if (typeof part.id !== 'number') {
    return null;
  }

  const title = (part.title || '').trim();
  if (!title) {
    return null;
  }

  return {
    title,
    releaseYear: parseYear(part.release_date, new Date().getFullYear()),
    mediaType: 'movie',
    tmdbId: part.id,
    narrativeJustification: normalizeOverview(part.overview, 'Parte de la misma saga o colección.'),
    posterUrl: buildImageUrl(part.poster_path),
    backdropUrl: buildImageUrl(part.backdrop_path),
  };
}

function getDetailCacheKey(movie: Movie): string | null {
  if (!movie.tmdbId) {
    return null;
  }
  return `detail:${movie.mediaType}:${movie.tmdbId}`;
}

export async function fetchMediaDetail(movie: Movie): Promise<MediaDetail | null> {
  if (!movie.tmdbId) {
    return null;
  }

  const cacheKey = getDetailCacheKey(movie);
  if (!cacheKey) {
    return null;
  }

  const now = Date.now();
  const cached = detailCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const inFlight = inFlightCache.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const { payload: detailPayload, resolvedMediaType } = await fetchDetailWithMediaTypeFallback(movie);
    const reviewsUrl = `/api/tmdb/${resolvedMediaType}/${movie.tmdbId}/reviews`;

    const reviewsPayload = await fetchJson<TmdbReviewResponse>(reviewsUrl).catch(() => ({ results: [] }));

    const publicReviews = (reviewsPayload.results || [])
      .map(toReview)
      .filter((review): review is PublicReview => Boolean(review))
      .slice(0, MAX_REVIEWS);

    const seasons = (detailPayload.seasons || [])
      .map(toSeasonSummary)
      .filter((season): season is MediaSeasonSummary => Boolean(season))
      .sort((left, right) => left.seasonNumber - right.seasonNumber);

    let collection: MediaDetail['collection'];
    const collectionId = detailPayload.belongs_to_collection?.id;
    if (resolvedMediaType === 'movie' && typeof collectionId === 'number') {
      try {
        const collectionPayload = await fetchJson<TmdbCollectionResponse>(
          `/api/tmdb/collection/by-id/${collectionId}`
        );
        const collectionItems = (collectionPayload.parts || [])
          .map(toCollectionMovie)
          .filter((item): item is Movie => Boolean(item))
          .filter((item) => item.tmdbId !== movie.tmdbId)
          .slice(0, MAX_COLLECTION_ITEMS);

        if (collectionItems.length > 0) {
          collection = {
            id: collectionPayload.id,
            name: collectionPayload.name,
            items: collectionItems,
          };
        }
      } catch (error) {
        console.error('No se pudo cargar la colección relacionada:', error);
      }
    }

    const detail: MediaDetail = {
      tmdbId: detailPayload.id,
      mediaType: resolvedMediaType,
      title: detailPayload.title || detailPayload.name || movie.title,
      overview: normalizeOverview(detailPayload.overview, movie.narrativeJustification),
      posterUrl: buildImageUrl(detailPayload.poster_path) || movie.posterUrl,
      backdropUrl: buildImageUrl(detailPayload.backdrop_path) || movie.backdropUrl,
      homepage: detailPayload.homepage || undefined,
      genres: (detailPayload.genres || []).map((genre) => genre.name),
      publicMetrics: {
        voteAverage:
          typeof detailPayload.vote_average === 'number' ? detailPayload.vote_average : undefined,
        voteCount:
          typeof detailPayload.vote_count === 'number' ? detailPayload.vote_count : undefined,
      },
      publicReviews,
      numberOfSeasons:
        resolvedMediaType === 'tv' && typeof detailPayload.number_of_seasons === 'number'
          ? detailPayload.number_of_seasons
          : undefined,
      numberOfEpisodes:
        resolvedMediaType === 'tv' && typeof detailPayload.number_of_episodes === 'number'
          ? detailPayload.number_of_episodes
          : undefined,
      seasons: resolvedMediaType === 'tv' ? seasons : [],
      collection,
    };

    detailCache.set(cacheKey, {
      expiresAt: now + CACHE_TTL_MS,
      value: detail,
    });

    return detail;
  })().finally(() => {
    inFlightCache.delete(cacheKey);
  });

  inFlightCache.set(cacheKey, request);
  return request;
}
