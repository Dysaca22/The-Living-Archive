import { Movie as ZodMovie } from '../schemas/movieSchema';
import { Movie, CachedMovie } from '../types/movie';

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
      tmdbId: zodMovie.tmdb_database_id,
      posterUrl: posterUrl,
      soundtrackHighlight: zodMovie.soundtrack_highlight
    };
  }

  /**
   * Maps a Movie domain model to a CachedMovie.
   */
  public static toCached(movie: Movie): CachedMovie {
    return {
      ...movie,
      timestamp: new Date().toISOString()
    };
  }
}
