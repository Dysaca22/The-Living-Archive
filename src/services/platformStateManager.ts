import { LocalCacheService } from './localCacheService';
import { MediaType, VaultMovieRecord } from '../types/movie';

/**
 * PlatformStateManager coordinates local-only persistence for the MVP.
 */
export class PlatformStateManager {
  /**
   * Returns normalized title inventory for prompt-level filtering.
   */
  public static async evaluateCurrentState(): Promise<string[]> {
    try {
      const movies = LocalCacheService.getMovies();
      return movies.map((movie) => movie.title.toLowerCase().trim());
    } catch (error) {
      console.error('Error evaluating current state:', error);
      throw new Error('Error al acceder a la memoria local del dispositivo.');
    }
  }

  public static evaluateCurrentStateSync(): VaultMovieRecord[] {
    return LocalCacheService.getMovies();
  }

  public static deleteFromLocalCache(title: string, releaseYear: number, mediaType: MediaType = 'movie'): void {
    LocalCacheService.deleteMovie(title, releaseYear, mediaType);
  }

  /**
   * Saves recommendations to local cache only.
   */
  public static async syncToLocalCache(movie: VaultMovieRecord): Promise<void> {
    try {
      LocalCacheService.saveMovie(movie);
    } catch (error) {
      console.error('Error syncing to local cache:', error);
      const message = error instanceof Error ? error.message : '';
      if (message.includes('vault is full')) {
        throw error;
      }
      throw new Error('Error al guardar: La bóveda de memoria no está disponible.');
    }
  }
}
