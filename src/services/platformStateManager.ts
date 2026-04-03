import { GoogleSheetsIntegrationService } from './googleSheetsIntegrationService';

interface MovieRecord {
  id: number;
  title: string;
  year: number;
}

/**
 * PlatformStateManager: Coordinates reading and writing of movie recommendations.
 * Ensures transactional integrity and provides clear error reporting.
 */
export class PlatformStateManager {
  
  /**
   * evaluate_current_state: Checks the current archive in Google Sheets.
   * Returns a list of existing movie titles for deduplication.
   */
  public static async evaluateCurrentState(): Promise<string[]> {
    try {
      const response = await GoogleSheetsIntegrationService.getMovies();
      
      if (response.status === 'error') {
        throw new Error(response.message || "La base de datos no está disponible.");
      }

      const movies = response.data || [];
      return movies.map((m: any) => m.title.toLowerCase());
    } catch (error) {
      console.error("Error evaluating current state:", error);
      throw new Error("Error: La base de datos no está disponible. Verifica la configuración de tu hoja de cálculo.");
    }
  }

  /**
   * sync_to_sheets_proxy: Sends a movie payload to the reverse proxy.
   * Maintains a purely transactional state.
   */
  public static async syncToSheetsProxy(movie: MovieRecord): Promise<void> {
    try {
      // Step 1: Verify current state before registration
      const existingTitles = await this.evaluateCurrentState();
      
      if (existingTitles.includes(movie.title.toLowerCase())) {
        console.warn(`Movie "${movie.title}" already exists in the archive.`);
        return;
      }

      // Step 2: Perform transactional write
      const response = await GoogleSheetsIntegrationService.saveMovie({
        id: movie.id,
        title: movie.title,
        year: movie.year
      });

      if (response.status === 'error') {
        throw new Error(response.message || "Error al sincronizar con la base de datos.");
      }
    } catch (error) {
      console.error("Error syncing to sheets proxy:", error);
      // User-friendly error message as requested
      throw new Error("Error: La base de datos no está disponible. Verifica el ID de la hoja de cálculo.");
    }
  }
}
