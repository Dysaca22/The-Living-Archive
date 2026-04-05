import type { MovieRecommendation, QuoteSceneRecommendation } from '../schemas/movieSchema';
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
  signal?: AbortSignal;
  apiKey?: string;
  generateRecommendations?: (
    userPrompt: string,
    historicalContext: string,
    existingTitles: string[],
    options?: { count?: number }
  ) => Promise<MovieRecommendation>;
}

interface QuoteSceneOptions {
  count?: number;
  signal?: AbortSignal;
  apiKey?: string;
  generateQuoteSceneMatches?: (
    userPrompt: string,
    historicalContext: string,
    existingTitles: string[],
    options?: { count?: number }
  ) => Promise<QuoteSceneRecommendation>;
}

export interface DiscoveryPhasedPayload {
  initialResults: Movie[];
  enrich: () => Promise<Movie[]>;
}

export interface QuoteScenePhasedPayload {
  initialResults: QuoteSceneResult[];
  enrich: () => Promise<QuoteSceneResult[]>;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('La búsqueda fue cancelada.', 'AbortError');
  }
}

function mapExistingTitles(): string[] {
  return PlatformStateManager.evaluateCurrentStateSync().map((movie) => movie.title.toLowerCase().trim());
}

function deduplicateMovies(items: Movie[]): Movie[] {
  const output: Movie[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const identity =
      typeof item.tmdbId === 'number'
        ? `tmdb:${item.tmdbId}`
        : `title:${item.mediaType}:${normalizeText(item.title)}:${item.releaseYear}`;

    if (seen.has(identity)) {
      continue;
    }
    seen.add(identity);
    output.push(item);
  }

  return output;
}

function deduplicateQuoteResults(items: QuoteSceneResult[]): QuoteSceneResult[] {
  const seen = new Set<string>();
  const output: QuoteSceneResult[] = [];

  for (const item of items) {
    const identity =
      typeof item.movie.tmdbId === 'number'
        ? `tmdb:${item.movie.tmdbId}`
        : `title:${item.movie.mediaType}:${normalizeText(item.movie.title)}:${item.movie.releaseYear}`;

    if (seen.has(identity)) {
      continue;
    }
    seen.add(identity);
    output.push(item);
  }

  return output;
}

/**
 * PresentationController consolidates search/discovery flows into UI-ready contracts.
 * It now supports phased responses to reduce perceived latency.
 */
export class PresentationController {
  public static async discoverCinematicResonancesPhased(
    query: string,
    historicalContext: string,
    options: DiscoveryOptions = {}
  ): Promise<DiscoveryPhasedPayload> {
    throwIfAborted(options.signal);

    const existingTitles = mapExistingTitles();
    const generateRecommendations =
      options.generateRecommendations ??
      ((userPrompt: string, context: string, inventory: string[], config?: { count?: number }) => {
        if (!options.apiKey) {
          throw new Error('Gemini no está configurado para este flujo.');
        }
        return GeminiService.generateRecommendations(options.apiKey, userPrompt, context, inventory, config);
      });

    const rawRecommendations = await generateRecommendations(
      query,
      historicalContext,
      existingTitles,
      { count: options.count }
    );
    throwIfAborted(options.signal);

    const filteredRecommendations = rawRecommendations.filter(
      (movie) => !existingTitles.includes(movie.title.toLowerCase().trim())
    );

    const initialResults = deduplicateMovies(
      filteredRecommendations.map((candidate) =>
        MovieMappers.fromZod({
          ...candidate,
          media_type: candidate.media_type === 'tv' ? 'tv' : 'movie',
        })
      )
    ).slice(0, options.count);

    const enrich = async () => {
      const enriched = await Promise.all(
        filteredRecommendations.map(async (candidate) => {
          throwIfAborted(options.signal);
          const mediaType = candidate.media_type === 'tv' ? 'tv' : 'movie';
          const tmdbId = await this.resolveTmdbId(
            candidate.title,
            candidate.release_year,
            mediaType,
            candidate.tmdb_database_id,
            options.signal
          );
          throwIfAborted(options.signal);

          const posterUrl = await ExternalApiService.resolveMovieArtwork(tmdbId ?? 0, mediaType, {
            signal: options.signal,
          });

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

      return deduplicateMovies(enriched).slice(0, options.count);
    };

    return {
      initialResults,
      enrich,
    };
  }

  public static async discoverCinematicResonances(
    apiKey: string,
    query: string,
    historicalContext: string,
    options: DiscoveryOptions = {}
  ): Promise<Movie[]> {
    const phased = await this.discoverCinematicResonancesPhased(query, historicalContext, {
      ...options,
      apiKey,
    });
    return phased.enrich();
  }

  public static async searchByQuoteOrScenePhased(
    query: string,
    historicalContext: string,
    options: QuoteSceneOptions = {}
  ): Promise<QuoteScenePhasedPayload> {
    throwIfAborted(options.signal);

    const existingTitles = mapExistingTitles();
    const generateQuoteSceneMatches =
      options.generateQuoteSceneMatches ??
      ((userPrompt: string, context: string, inventory: string[], config?: { count?: number }) => {
        if (!options.apiKey) {
          throw new Error('Gemini no está configurado para este flujo.');
        }
        return GeminiService.generateQuoteSceneMatches(options.apiKey, userPrompt, context, inventory, config);
      });

    const rawMatches = await generateQuoteSceneMatches(
      query,
      historicalContext,
      existingTitles,
      { count: options.count }
    );
    throwIfAborted(options.signal);

    const initialResults = deduplicateQuoteResults(
      rawMatches.map((candidate) => ({
        movie: MovieMappers.fromQuoteScene({
          ...candidate,
          media_type: candidate.media_type === 'tv' ? 'tv' : 'movie',
        }),
        confidenceScore: candidate.confidence_score,
        matchMode: candidate.match_mode,
        matchExplanation: candidate.match_explanation,
        ambiguityNote: candidate.ambiguity_note,
        matchedQuote: candidate.matched_quote,
      }))
    ).slice(0, options.count);

    const enrich = async () => {
      const normalizedMatches = await Promise.all(
        rawMatches.map(async (candidate) => this.normalizeQuoteSceneMatch(candidate, options.signal))
      );

      return deduplicateQuoteResults(normalizedMatches).slice(0, options.count);
    };

    return {
      initialResults,
      enrich,
    };
  }

  public static async searchByQuoteOrScene(
    apiKey: string,
    query: string,
    historicalContext: string,
    options: QuoteSceneOptions = {}
  ): Promise<QuoteSceneResult[]> {
    const phased = await this.searchByQuoteOrScenePhased(query, historicalContext, {
      ...options,
      apiKey,
    });
    return phased.enrich();
  }

  private static async normalizeQuoteSceneMatch(
    candidate: QuoteSceneMatch,
    signal?: AbortSignal
  ): Promise<QuoteSceneResult> {
    throwIfAborted(signal);

    const mediaType = candidate.media_type === 'tv' ? 'tv' : 'movie';
    const tmdbId = await this.resolveTmdbId(candidate.title, candidate.release_year, mediaType, candidate.tmdb_database_id, signal);
    throwIfAborted(signal);

    const posterUrl = await ExternalApiService.resolveMovieArtwork(tmdbId ?? 0, mediaType, {
      signal,
    });

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
    providedTmdbId?: number,
    signal?: AbortSignal
  ): Promise<number | undefined> {
    if (providedTmdbId) {
      return providedTmdbId;
    }

    throwIfAborted(signal);
    const directMatch = await ExternalApiService.searchMovieId(title, releaseYear, mediaType, { signal });
    if (directMatch) {
      return directMatch;
    }

    const fallbackType = mediaType === 'movie' ? 'tv' : 'movie';
    throwIfAborted(signal);
    return ExternalApiService.searchMovieId(title, releaseYear, fallbackType, { signal });
  }
}
