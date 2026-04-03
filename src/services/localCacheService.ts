/**
 * LocalCacheService: Manages movie recommendations in the browser's localStorage.
 * Provides a decentralized and autonomous storage solution.
 */

export interface CachedMovie {
  title: string;
  director: string;
  year: number;
  match_score: number;
  astral_reasoning: string;
  tmdb_id?: number;
  poster?: string;
  timestamp: string;
}

const CACHE_KEY = 'the_living_archive_vault';

export class LocalCacheService {
  /**
   * Retrieves all movies from the local cache.
   */
  public static getMovies(): CachedMovie[] {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to read from local cache:", error);
      return [];
    }
  }

  /**
   * Saves a movie to the local cache.
   */
  public static saveMovie(movie: Omit<CachedMovie, 'timestamp'>): void {
    try {
      const movies = this.getMovies();
      
      // Check for duplicates
      if (movies.some(m => m.title.toLowerCase() === movie.title.toLowerCase())) {
        console.warn(`Movie "${movie.title}" is already in the vault.`);
        return;
      }

      const newMovie: CachedMovie = {
        ...movie,
        timestamp: new Date().toISOString()
      };

      movies.push(newMovie);
      localStorage.setItem(CACHE_KEY, JSON.stringify(movies));
    } catch (error) {
      console.error("Failed to save to local cache:", error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error("La bóveda de memoria está llena. Por favor, limpia la caché local para continuar.");
      }
      throw new Error("Error al acceder a la memoria local del dispositivo.");
    }
  }

  /**
   * Removes a movie from the local cache by title.
   */
  public static deleteMovie(title: string): void {
    try {
      const movies = this.getMovies();
      const filteredMovies = movies.filter(m => m.title !== title);
      localStorage.setItem(CACHE_KEY, JSON.stringify(filteredMovies));
    } catch (error) {
      console.error("Failed to delete from local cache:", error);
    }
  }

  /**
   * Clears the entire local cache.
   */
  public static clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
}
