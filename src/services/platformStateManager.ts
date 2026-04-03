import { LocalCacheService } from './localCacheService';
import { RemotePersistenceService } from './remotePersistenceService';
import { Movie, CachedMovie } from '../types/movie';

/**
 * PlatformStateManager: Coordinates reading and writing of movie recommendations.
 * Ensures transactional integrity using the browser's local cache and remote sync.
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
  public static deleteFromLocalCache(title: string, releaseYear: number): void {
    LocalCacheService.deleteMovie(title, releaseYear);
  }

  /**
   * sync_to_local_cache: Saves a movie recommendation to the local cache and remote vault.
   * Implements a Dual-Write strategy for maximum resilience.
   */
  public static async syncToLocalCache(movie: CachedMovie): Promise<void> {
    try {
      // Step 1: Verify current state before registration
      const existingTitles = await this.evaluateCurrentState();
      
      if (existingTitles.includes(movie.title.toLowerCase())) {
        console.warn(`Movie "${movie.title}" already exists in the archive.`);
        return;
      }

      // Step 2: Perform transactional write to local cache (Primary)
      LocalCacheService.saveMovie(movie);

      // Step 3: Attempt asynchronous sync to remote vault (Secondary)
      // This is non-blocking to ensure local performance
      RemotePersistenceService.syncMovie(movie).catch(err => {
        console.error("Background Remote Sync Failed:", err);
      });

    } catch (error) {
      console.error("Error syncing to local cache:", error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("vault is full")) {
        throw error;
      }
      throw new Error("Error al guardar: La bóveda de memoria no está disponible.");
    }
  }
}
