/**
 * LocalCacheService: Manages movie recommendations in the browser's localStorage.
 * Provides a decentralized and autonomous storage solution.
 */

import { VaultMovieRecord } from '../types/movie';

const CACHE_KEY = 'the_living_archive_vault';

export class LocalCacheService {
  /**
   * Retrieves all movies from the local cache, sorted by timestamp descending.
   */
  public static getMovies(): VaultMovieRecord[] {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      const movies: VaultMovieRecord[] = data ? JSON.parse(data) : [];
      
      // Sort by timestamp descending (newest first)
      return movies.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error("Failed to read from local cache:", error);
      return [];
    }
  }

  /**
   * Saves a movie to the local cache with robust deduplication.
   */
  public static saveMovie(movie: VaultMovieRecord): void {
    try {
      const movies = this.getMovies();
      
      // Robust Deduplication:
      // 1. Check by TMDB ID if both have it
      // 2. Fallback to normalized title + year
      const isDuplicate = movies.some(m => {
        if (m.tmdbId && movie.tmdbId) {
          return m.tmdbId === movie.tmdbId;
        }
        const normalizedExisting = `${m.title.toLowerCase().trim()}_${m.releaseYear}`;
        const normalizedNew = `${movie.title.toLowerCase().trim()}_${movie.releaseYear}`;
        return normalizedExisting === normalizedNew;
      });

      if (isDuplicate) {
        throw new Error(`The resonance for "${movie.title}" is already persisted in the vault.`);
      }

      movies.push(movie);
      this.persist(movies);
    } catch (error) {
      this.handleStorageError(error);
    }
  }

  /**
   * Removes a movie from the local cache by title and release year.
   */
  public static deleteMovie(title: string, releaseYear: number): void {
    try {
      const movies = this.getMovies();
      const filteredMovies = movies.filter(m => 
        !(m.title === title && m.releaseYear === releaseYear)
      );
      this.persist(filteredMovies);
    } catch (error) {
      console.error("Failed to delete from local cache:", error);
    }
  }

  /**
   * Updates an existing movie in the local cache.
   */
  public static updateMovie(title: string, releaseYear: number, updates: Partial<VaultMovieRecord>): void {
    try {
      const movies = this.getMovies();
      const updatedMovies = movies.map(m => {
        if (m.title === title && m.releaseYear === releaseYear) {
          return { ...m, ...updates };
        }
        return m;
      });
      this.persist(updatedMovies);
    } catch (error) {
      console.error("Failed to update local cache:", error);
    }
  }

  /**
   * Exports the entire archive as a JSON string.
   */
  public static exportArchive(): string {
    const movies = this.getMovies();
    return JSON.stringify({
      version: "1.0",
      exportedAt: new Date().toISOString(),
      movies
    }, null, 2);
  }

  /**
   * Imports movies from a JSON string.
   */
  public static importArchive(jsonString: string): { imported: number; skipped: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.movies || !Array.isArray(data.movies)) {
        throw new Error("Invalid archive format.");
      }

      const existingMovies = this.getMovies();
      let imported = 0;
      let skipped = 0;

      const newMovies = [...existingMovies];

      for (const movie of data.movies) {
        if (!movie || typeof movie !== 'object' || !movie.title || typeof movie.title !== 'string' || !movie.releaseYear || typeof movie.releaseYear !== 'number') {
          throw new Error("Invalid movie format in archive. Missing required fields.");
        }

        const isDuplicate = newMovies.some(m => {
          if (m.tmdbId && movie.tmdbId) return m.tmdbId === movie.tmdbId;
          return m.title.toLowerCase().trim() === movie.title.toLowerCase().trim() && m.releaseYear === movie.releaseYear;
        });

        if (!isDuplicate) {
          newMovies.push(movie);
          imported++;
        } else {
          skipped++;
        }
      }

      this.persist(newMovies);
      return { imported, skipped };
    } catch (error) {
      console.error("Failed to import archive:", error);
      throw new Error("The imported file is corrupted or incompatible with the astral records.");
    }
  }

  /**
   * Clears the entire local cache.
   */
  public static clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }

  /**
   * Internal persistence helper.
   */
  private static persist(movies: VaultMovieRecord[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(movies));
    } catch (error) {
      this.handleStorageError(error);
    }
  }

  /**
   * Standardized error handling for storage limits.
   */
  private static handleStorageError(error: unknown): never {
    console.error("Storage Error:", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error("The vault is full. Please clear some resonances to make room for new echoes.");
    }
    if (error instanceof Error) throw error;
    throw new Error("An unknown error occurred while accessing the local device memory.");
  }
}
