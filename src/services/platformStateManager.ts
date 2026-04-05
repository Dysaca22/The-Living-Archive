import { LocalCacheService } from './localCacheService';
import { VaultMovieRecord } from '../types/movie';

/**
 * Orquesta persistencia local para el MVP.
 */
export class PlatformStateManager {
  /**
   * Retorna inventario normalizado de titulos para filtrado en prompts.
   */
  public static async evaluateCurrentState(): Promise<string[]> {
    try {
      const movies = LocalCacheService.getMovies();
      return movies.map((movie) => movie.title.toLowerCase().trim());
    } catch (error) {
      console.error('Error evaluando estado local:', error);
      throw new Error('No fue posible leer la boveda local.');
    }
  }

  public static evaluateCurrentStateSync(): VaultMovieRecord[] {
    return LocalCacheService.getMovies();
  }

  /**
   * Guarda recomendaciones en cache local.
   */
  public static async syncToLocalCache(movie: VaultMovieRecord): Promise<void> {
    try {
      LocalCacheService.saveMovie(movie);
    } catch (error) {
      console.error('Error sincronizando cache local:', error);
      const message = error instanceof Error ? error.message : '';
      if (message.includes('boveda local esta llena') || message.includes('vault is full')) {
        throw error;
      }
      throw new Error('Error al guardar: la boveda local no esta disponible.');
    }
  }
}
