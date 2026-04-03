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
  private static readonly TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

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
   * Fetches metadata from The Movie Database API.
   */
  public static async resolveMovieArtwork(tmdbDatabaseId: number): Promise<string> {
    if (!this.TMDB_API_KEY) {
      console.warn('VITE_TMDB_API_KEY is missing. Returning fallback artwork.');
      return FALLBACK_POSTER_URL;
    }

    try {
      const url = `https://api.themoviedb.org/3/movie/${tmdbDatabaseId}?api_key=${this.TMDB_API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
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
