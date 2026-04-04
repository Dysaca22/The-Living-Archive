import { Movie } from '../types/movie';
import { ExternalApiService } from './externalApiService';
import { GeminiService } from './geminiService';
import { PlatformStateManager } from './platformStateManager';
import { MovieMappers } from '../mappers/movieMappers';
import { QuoteSceneMatch } from '../schemas/movieSchema';

export interface UIState {
  recommendations: Movie[];
  historicalContext: string;
  isLoading: boolean;
  error: string | null;
}

export interface QuoteSceneResult {
  movie: Movie;
  confidenceScore: number;
  matchMode: 'quote_exact' | 'scene_description' | 'theme_similarity';
  matchExplanation: string;
  ambiguityNote?: string;
  matchedQuote?: string;
}

interface DiscoveryOptions {
  count?: number;
}

/**
 * PresentationController consolidates search/discovery flows into UI-ready contracts.
 */
export class PresentationController {
  /**
   * General discovery flow.
   */
  public static async discoverCinematicResonances(
    apiKey: string,
    query: string,
    historicalContext: string,
    options: DiscoveryOptions = {}
  ): Promise<Movie[]> {
    const existingTitles = await PlatformStateManager.evaluateCurrentState();
    const rawRecommendations = await GeminiService.generateRecommendations(
      apiKey,
      query,
      historicalContext,
      existingTitles,
      { count: options.count }
    );

    const enrichedRecommendations = await Promise.all(
      rawRecommendations
        .filter((movie) => !existingTitles.includes(movie.title.toLowerCase().trim()))
        .map(async (candidate) => {
          const mediaType = candidate.media_type === 'tv' ? 'tv' : 'movie';
          const tmdbId = await this.resolveTmdbId(candidate.title, candidate.release_year, mediaType, candidate.tmdb_database_id);
          const posterUrl = await ExternalApiService.resolveMovieArtwork(tmdbId || 0, mediaType);
          return MovieMappers.fromZod(
            {
              ...candidate,
              tmdb_database_id: tmdbId,
              media_type: mediaType,
            },
            posterUrl
          );
        })
    );

    return enrichedRecommendations;
  }

  /**
   * Dedicated phrase/scene matching flow.
   */
  public static async searchByQuoteOrScene(
    apiKey: string,
    query: string,
    historicalContext: string,
    options: DiscoveryOptions = {}
  ): Promise<QuoteSceneResult[]> {
    const existingTitles = await PlatformStateManager.evaluateCurrentState();
    const rawMatches = await GeminiService.generateQuoteSceneMatches(
      apiKey,
      query,
      historicalContext,
      existingTitles,
      { count: options.count }
    );

    const normalizedMatches = await Promise.all(
      rawMatches.map(async (candidate) => this.normalizeQuoteSceneMatch(candidate))
    );

    return normalizedMatches;
  }

  private static async normalizeQuoteSceneMatch(candidate: QuoteSceneMatch): Promise<QuoteSceneResult> {
    const mediaType = candidate.media_type === 'tv' ? 'tv' : 'movie';
    const tmdbId = await this.resolveTmdbId(candidate.title, candidate.release_year, mediaType, candidate.tmdb_database_id);
    const posterUrl = await ExternalApiService.resolveMovieArtwork(tmdbId || 0, mediaType);

    const movie = MovieMappers.fromQuoteScene(
      {
        ...candidate,
        tmdb_database_id: tmdbId,
        media_type: mediaType,
      },
      posterUrl
    );

    return {
      movie,
      confidenceScore: candidate.confidence_score,
      matchMode: candidate.match_mode,
      matchExplanation: candidate.match_explanation,
      ambiguityNote: candidate.ambiguity_note,
      matchedQuote: candidate.matched_quote,
    };
  }

  private static async resolveTmdbId(
    title: string,
    releaseYear: number,
    mediaType: 'movie' | 'tv',
    providedTmdbId?: number
  ): Promise<number | undefined> {
    if (providedTmdbId) {
      return providedTmdbId;
    }

    const directMatch = await ExternalApiService.searchMovieId(title, releaseYear, mediaType);
    if (directMatch) {
      return directMatch;
    }

    const fallbackType = mediaType === 'movie' ? 'tv' : 'movie';
    return ExternalApiService.searchMovieId(title, releaseYear, fallbackType);
  }
}
