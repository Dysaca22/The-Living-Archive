/**
 * External API Service
 *
 * Provides connectivity to third-party RESTful services for historical context
 * and movie metadata enrichment.
 */

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_POSTER_URL = 'https://picsum.photos/seed/archive-fallback/500/750?blur=2';

interface TmdbMovieDetails {
  poster_path: string | null;
}

interface TmdbSearchResult {
  id: number;
  media_type?: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
}

interface RequestOptions {
  signal?: AbortSignal;
}

type WikipediaEvent = { year?: number; text?: string };

let historicalDayCache: { key: string; events: WikipediaEvent[] } | null = null;

const artworkCache = new Map<string, string>();
const artworkInFlight = new Map<string, Promise<string>>();
const searchIdCache = new Map<string, number | undefined>();
const searchIdInFlight = new Map<string, Promise<number | undefined>>();

function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export class ExternalApiService {
  public static readonly FALLBACK_POSTER_URL = FALLBACK_POSTER_URL;

  /**
   * Fetches a random historical event for the current day.
   * Uses Wikipedia's "On This Day" REST API for better CORS support.
   */
  public static async fetchHistoricalDailyContext(): Promise<string> {
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dayKey = `${month}-${day}`;

      if (historicalDayCache && historicalDayCache.key === dayKey && historicalDayCache.events.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(historicalDayCache.events.length, 20));
        const event = historicalDayCache.events[randomIndex];
        return `${event.year}: ${event.text}`;
      }

      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`);

      if (!response.ok) {
        throw new Error(`Wikipedia API respondió con estado ${response.status}.`);
      }

      const result = await response.json();
      const events = (result.events || []) as WikipediaEvent[];
      historicalDayCache = { key: dayKey, events };

      if (events.length === 0) {
        return 'No se encontraron efemérides para hoy en la fuente pública.';
      }

      const randomIndex = Math.floor(Math.random() * Math.min(events.length, 20));
      const event = events[randomIndex];

      return `${event.year}: ${event.text}`;
    } catch (error) {
      console.error('No se pudo cargar la efeméride diaria:', error);
      return 'No fue posible cargar la efeméride del día.';
    }
  }

  /**
   * Resolves the full poster URL for a given TMDB ID.
   * Fetches metadata from the internal server proxy.
   */
  public static async resolveMovieArtwork(
    tmdbDatabaseId: number,
    mediaType: 'movie' | 'tv' = 'movie',
    options: RequestOptions = {}
  ): Promise<string> {
    if (!Number.isFinite(tmdbDatabaseId) || tmdbDatabaseId <= 0) {
      return FALLBACK_POSTER_URL;
    }

    const key = `${mediaType}:${tmdbDatabaseId}`;
    const cached = artworkCache.get(key);
    if (cached) {
      return cached;
    }

    const inFlight = artworkInFlight.get(key);
    if (inFlight) {
      return inFlight;
    }

    const request = (async () => {
      try {
        const response = await fetch(`/api/tmdb/${mediaType}/${tmdbDatabaseId}`, {
          signal: options.signal,
        });

        if (!response.ok) {
          if (response.status === 503) {
            console.warn('TMDB no está configurado en el servidor. Se usa portada de respaldo.');
          } else {
            throw new Error(`TMDB proxy devolvió estado ${response.status}.`);
          }
          return FALLBACK_POSTER_URL;
        }

        const data: TmdbMovieDetails = await response.json();
        const resolved = data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : FALLBACK_POSTER_URL;
        artworkCache.set(key, resolved);
        return resolved;
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }
        console.error(`No se pudo resolver portada TMDB para ${tmdbDatabaseId}:`, error);
        return FALLBACK_POSTER_URL;
      } finally {
        artworkInFlight.delete(key);
      }
    })();

    artworkInFlight.set(key, request);
    return request;
  }

  /**
   * Fallback: Searches for a TMDB ID using title and year if Gemini fails to provide one.
   * Calls the internal server proxy.
   */
  public static async searchMovieId(
    title: string,
    year: number,
    mediaType: 'movie' | 'tv' = 'movie',
    options: RequestOptions = {}
  ): Promise<number | undefined> {
    const normalizedTitle = normalizeQuery(title);
    const key = `${mediaType}:${year}:${normalizedTitle}`;
    if (searchIdCache.has(key)) {
      return searchIdCache.get(key);
    }

    const inFlight = searchIdInFlight.get(key);
    if (inFlight) {
      return inFlight;
    }

    const request = (async () => {
      try {
        const url = `/api/tmdb/search/multi?query=${encodeURIComponent(title)}`;
        const response = await fetch(url, {
          signal: options.signal,
        });

        if (!response.ok) {
          return undefined;
        }

        const data = await response.json();
        const results = (data.results || []) as TmdbSearchResult[];

        const matched = results.find((result) => {
          if (result.media_type && result.media_type !== mediaType) {
            return false;
          }
          const rawDate = mediaType === 'tv' ? result.first_air_date : result.release_date;
          const candidateYear = rawDate ? Number.parseInt(rawDate.slice(0, 4), 10) : undefined;
          return !candidateYear || candidateYear === year;
        });

        const resolvedId = matched?.id;
        searchIdCache.set(key, resolvedId);
        return resolvedId;
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }
        console.error(`No se pudo resolver TMDB id para "${title}":`, error);
        return undefined;
      } finally {
        searchIdInFlight.delete(key);
      }
    })();

    searchIdInFlight.set(key, request);
    return request;
  }

  /**
   * Comprehensive metadata fetch.
   * Combines visual metadata with historical context.
   */
  public static async fetchMovieMetadata(tmdbId: number, mediaType: 'movie' | 'tv' = 'movie') {
    const [artworkUrl, historicalContext] = await Promise.all([
      this.resolveMovieArtwork(tmdbId, mediaType),
      this.fetchHistoricalDailyContext(),
    ]);

    return {
      tmdbId,
      artworkUrl,
      historicalContext,
      timestamp: new Date().toISOString(),
    };
  }
}
