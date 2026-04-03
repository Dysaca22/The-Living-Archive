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

export class ExternalApiService {
  /**
   * Fetches a random historical event for the current day.
   * Uses Wikipedia's "On This Day" REST API for better CORS support.
   */
  public static async fetchHistoricalDailyContext(): Promise<string> {
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`);
      
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }

      const result = await response.json();
      const events = result.events || [];

      if (events.length === 0) {
        return "A quiet day in the annals of history, where the astral flow remained undisturbed.";
      }

      // Pseudo-random selection of a high-impact event
      const randomIndex = Math.floor(Math.random() * Math.min(events.length, 20)); // Focus on top events
      const event = events[randomIndex];

      return `${event.year}: ${event.text}`;
    } catch (error) {
      console.error('Failed to fetch historical context:', error);
      return "History is currently obscured by the astral mists. Seek your own path.";
    }
  }

  /**
   * Resolves the full poster URL for a given TMDB ID.
   * Fetches metadata from the internal server proxy.
   */
  public static async resolveMovieArtwork(tmdbDatabaseId: number): Promise<string> {
    try {
      const response = await fetch(`/api/tmdb/movie/${tmdbDatabaseId}`);

      if (!response.ok) {
        if (response.status === 503) {
          console.warn('TMDB access not configured on server. Returning fallback artwork.');
        } else {
          throw new Error(`TMDB proxy error: ${response.status}`);
        }
        return FALLBACK_POSTER_URL;
      }

      const data: TmdbMovieDetails = await response.json();

      if (data.poster_path) {
        return `${TMDB_IMAGE_BASE_URL}${data.poster_path}`;
      }

      return FALLBACK_POSTER_URL;
    } catch (error) {
      console.error(`Failed to resolve artwork for TMDB ID ${tmdbDatabaseId}:`, error);
      return FALLBACK_POSTER_URL;
    }
  }

  /**
   * Fallback: Searches for a TMDB ID using title and year if Gemini fails to provide one.
   * Calls the internal server proxy.
   */
  public static async searchMovieId(title: string, year: number): Promise<number | undefined> {
    try {
      const url = `/api/tmdb/search?query=${encodeURIComponent(title)}&year=${year}`;
      const response = await fetch(url);
      
      if (!response.ok) return undefined;

      const data = await response.json();
      const results = data.results || [];

      if (results.length > 0) {
        return results[0].id;
      }
      
      return undefined;
    } catch (error) {
      console.error(`Failed to search TMDB ID for ${title}:`, error);
      return undefined;
    }
  }

  /**
   * Comprehensive metadata fetch (The "fetch_movie_metadata" action).
   * Combines visual metadata with historical context.
   */
  public static async fetchMovieMetadata(tmdbId: number) {
    const [artworkUrl, historicalContext] = await Promise.all([
      this.resolveMovieArtwork(tmdbId),
      this.fetchHistoricalDailyContext()
    ]);

    return {
      tmdbId,
      artworkUrl,
      historicalContext,
      timestamp: new Date().toISOString()
    };
  }
}
