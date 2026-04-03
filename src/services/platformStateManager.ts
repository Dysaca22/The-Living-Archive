import { LocalCacheService, CachedMovie } from './localCacheService';

/**
 * PlatformStateManager: Coordinates reading and writing of movie recommendations.
 * Ensures transactional integrity using the browser's local cache.
 */
export class PlatformStateManager {
  
  /**
   * evaluate_current_state: Checks the current archive in local cache.
   * Returns a list of existing movie titles for deduplication.
   */
  public static async evaluateCurrentState(): Promise<string[]> {
    try {
      const movies = LocalCacheService.getMovies();
      return movies.map((m: CachedMovie) => m.title.toLowerCase());
    } catch (error) {
      console.error("Error evaluating current state:", error);
      throw new Error("Error al acceder a la memoria local del dispositivo.");
    }
  }

  /**
   * evaluateCurrentStateSync: Synchronous version for initial load.
   */
  public static evaluateCurrentStateSync(): CachedMovie[] {
    return LocalCacheService.getMovies();
  }

  /**
   * deleteFromLocalCache: Removes a movie from the local archive.
   */
  public static deleteFromLocalCache(title: string): void {
    LocalCacheService.deleteMovie(title);
  }

  /**
   * sync_to_local_cache: Saves a movie recommendation to the local cache.
   * Maintains a purely transactional state.
   */
  public static async syncToLocalCache(movie: Omit<CachedMovie, 'timestamp'>): Promise<void> {
    try {
      // Step 1: Verify current state before registration
      const existingTitles = await this.evaluateCurrentState();
      
      if (existingTitles.includes(movie.title.toLowerCase())) {
        console.warn(`Movie "${movie.title}" already exists in the archive.`);
        return;
      }

      // Step 2: Perform transactional write to local cache
      LocalCacheService.saveMovie(movie);
    } catch (error: any) {
      console.error("Error syncing to local cache:", error);
      // User-friendly error message as requested
      if (error.message.includes("bóveda de memoria está llena")) {
        throw error;
      }
      throw new Error("Error al guardar: La bóveda de memoria no está disponible.");
    }
  }
}
