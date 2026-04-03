import { Movie } from '../schemas/movieSchema';
import { ExternalApiService } from './externalApiService';
import { GeminiService } from './geminiService';
import { PlatformStateManager } from './platformStateManager';

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
        .map(async (movie) => {
          const poster = await ExternalApiService.resolveMovieArtwork(movie.tmdb_database_id || 0);
          
          // Final Data Contract for the UI
          return {
            ...movie,
            poster,
            // Ensure crossOrigin is handled at the component level, 
            // but we provide the fully qualified URL here.
          };
        })
    );

    return enrichedRecommendations as Movie[];
  }
}
