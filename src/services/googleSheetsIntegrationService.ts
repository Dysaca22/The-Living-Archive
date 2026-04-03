/**
 * Google Sheets Integration Service
 * 
 * This service communicates with a Google Apps Script (GAS) Web App acting as a reverse proxy.
 * It handles reading and writing movie data without exposing service account credentials.
 */

interface SaveMovieParams {
  title: string;
  year: number;
  id: number;
}

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export class GoogleSheetsIntegrationService {
  private static readonly WEB_APP_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL;

  /**
   * Saves a movie recommendation to the Google Sheet.
   * Handles the HTTP 302 redirect by setting redirect: 'follow'.
   */
  public static async saveMovie(params: SaveMovieParams): Promise<ApiResponse> {
    if (!this.WEB_APP_URL) {
      throw new Error('VITE_GOOGLE_SHEETS_WEB_APP_URL is not defined in environment variables.');
    }

    try {
      const response = await fetch(this.WEB_APP_URL, {
        method: 'POST',
        // Google Apps Script requires text/plain for the payload to be accessible via e.postData.contents
        // if you want to avoid preflight (OPTIONS) requests, but here we use standard JSON.
        // GAS handles the redirect automatically.
        redirect: 'follow',
        body: JSON.stringify({
          action: 'saveMovie',
          ...params
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving movie to Google Sheets:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown network error'
      };
    }
  }

  /**
   * Retrieves all saved movies from the Google Sheet.
   */
  public static async getMovies(): Promise<ApiResponse<any[]>> {
    if (!this.WEB_APP_URL) {
      throw new Error('VITE_GOOGLE_SHEETS_WEB_APP_URL is not defined in environment variables.');
    }

    try {
      const response = await fetch(this.WEB_APP_URL, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<any[]> = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching movies from Google Sheets:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown network error'
      };
    }
  }
}
