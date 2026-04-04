import { Movie as ZodMovie, QuoteSceneMatch } from '../schemas/movieSchema';
import { Movie, VaultMovieRecord } from '../types/movie';

/**
 * Movie Mappers: Handles translations between different data representations.
 * Ensures that the UI and Cache layers remain decoupled from the AI schema.
 */
export class MovieMappers {
  /**
   * Maps a ZodMovie (from Gemini) to our unified Movie domain model.
   */
  public static fromZod(zodMovie: ZodMovie, posterUrl?: string): Movie {
    return {
      title: zodMovie.title,
      releaseYear: zodMovie.release_year,
      narrativeJustification: zodMovie.narrative_justification,
      mediaType: zodMovie.media_type === 'tv' ? 'tv' : 'movie',
      tmdbId: zodMovie.tmdb_database_id,
      posterUrl: posterUrl,
      soundtrackHighlight: zodMovie.soundtrack_highlight
    };
  }

  /**
   * Maps a quote/scene Gemini match to the unified Movie domain model.
   */
  public static fromQuoteScene(match: QuoteSceneMatch, posterUrl?: string): Movie {
    return {
      title: match.title,
      releaseYear: match.release_year,
      narrativeJustification: match.match_explanation,
      mediaType: match.media_type === 'tv' ? 'tv' : 'movie',
      tmdbId: match.tmdb_database_id,
      posterUrl: posterUrl,
      soundtrackHighlight: match.soundtrack_highlight,
    };
  }

  /**
   * Maps a Movie domain model to a VaultMovieRecord.
   */
  public static toVaultRecord(movie: Movie): VaultMovieRecord {
    return {
      ...movie,
      timestamp: new Date().toISOString(),
      status: 'no_visto'
    };
  }
}
