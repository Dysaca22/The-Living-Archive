import { Movie } from '../types/movie';
import { ExternalApiService } from './externalApiService';
import { GeminiService } from './geminiService';
import { PlatformStateManager } from './platformStateManager';
import { MovieMappers } from '../mappers/movieMappers';

export interface UIState {
  recommendations: Movie[];
  historicalContext: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * PresentationController: Consolidates data from all astral nodes
 * and emits the final data contract for the UI.
 */
export class PresentationController {
  
  /**
   * Orchestrates the discovery flow and returns the final UI data contract.
   */
  public static async discoverCinematicResonances(
    apiKey: string,
    query: string,
    historicalContext: string
  ): Promise<Movie[]> {
    // 1. Verify current state (Deduplication)
    const existingTitles = await PlatformStateManager.evaluateCurrentState();

    // 2. Generate structured recommendations via Gemini
    const rawRecommendations = await GeminiService.generateRecommendations(
      apiKey,
      query,
      historicalContext,
      existingTitles
    );

    // 3. Consolidate and enrich with visual metadata (TMDB)
    const enrichedRecommendations = await Promise.all(
      rawRecommendations
        .filter(movie => !existingTitles.includes(movie.title.toLowerCase()))
        .map(async (zodMovie) => {
          let tmdbId = zodMovie.tmdb_database_id;
          
          // Fallback: If TMDB ID is missing, try to search for it
          if (!tmdbId) {
            console.info(`TMDB ID missing for "${zodMovie.title}". Attempting search fallback...`);
            tmdbId = await ExternalApiService.searchMovieId(zodMovie.title, zodMovie.release_year);
          }

          const posterUrl = await ExternalApiService.resolveMovieArtwork(tmdbId || 0);
          
          // Map to unified domain model
          return MovieMappers.fromZod(zodMovie, posterUrl);
        })
    );

    return enrichedRecommendations;
  }
}
