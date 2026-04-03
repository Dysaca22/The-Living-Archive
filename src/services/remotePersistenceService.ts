import { VaultMovieRecord } from '../types/movie';

/**
 * RemotePersistenceService: Handles communication with the server-side proxy
 * for remote archive storage.
 */
export class RemotePersistenceService {
  /**
   * Fetches the entire remote archive.
   */
  public static async fetchRemoteVault(): Promise<VaultMovieRecord[]> {
    try {
      const response = await fetch('/api/vault');
      if (!response.ok) {
        if (response.status === 503) return []; // Not configured
        throw new Error(`Remote Vault Error: ${response.status}`);
      }
      const data = await response.json();
      return data.movies || [];
    } catch (error) {
      console.error("Failed to fetch remote vault:", error);
      return [];
    }
  }

  /**
   * Checks if the remote vault is configured on the server.
   */
  public static async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/vault');
      return response.status !== 503;
    } catch {
      return false;
    }
  }

  /**
   * Syncs a single movie to the remote archive.
   */
  public static async syncMovie(movie: VaultMovieRecord): Promise<void> {
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movie),
      });

      if (!response.ok) {
        if (response.status === 503) {
          console.info("Remote vault not configured. Skipping remote sync.");
          return;
        }
        throw new Error(`Remote Sync Error: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to sync movie to remote vault:", error);
      // We don't throw here to avoid blocking the local save flow
    }
  }
}
