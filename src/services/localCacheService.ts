/**
 * LocalCacheService: Handles the localStorage vault as the MVP source of truth.
 */

import {
  LegacyViewingStatus,
  MediaType,
  VaultMovieRecord,
  ViewingStatus,
  migrateViewingStatus,
  normalizeMediaType,
} from '../types/movie';
import { isSameArchiveItem } from '../features/vault/utils/archiveIdentity';

const CACHE_KEY = 'the_living_archive_vault';

type RawVaultMovieRecord = Partial<VaultMovieRecord> & {
  status?: ViewingStatus | LegacyViewingStatus;
  mediaType?: MediaType | string;
};

export class LocalCacheService {
  /**
   * Retrieves all movies from local cache, applies migration, deduplicates, and sorts by timestamp.
   */
  public static getMovies(): VaultMovieRecord[] {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      const parsed: unknown = data ? JSON.parse(data) : [];
      if (!Array.isArray(parsed)) {
        return [];
      }

      const normalizedMovies: VaultMovieRecord[] = [];
      let didMigrate = false;

      for (const candidate of parsed) {
        const result = this.normalizeRecord(candidate as RawVaultMovieRecord);
        if (!result.record) {
          continue;
        }

        normalizedMovies.push(result.record);
        if (result.didMigrate) {
          didMigrate = true;
        }
      }

      const deduplicated = this.deduplicate(normalizedMovies).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (didMigrate || deduplicated.length !== parsed.length) {
        this.persist(deduplicated);
      }

      return deduplicated;
    } catch (error) {
      console.error('Failed to read from local cache:', error);
      return [];
    }
  }

  /**
   * Saves a movie using unified identity deduplication.
   */
  public static saveMovie(movie: VaultMovieRecord): void {
    try {
      const normalized = this.normalizeRecord(movie).record;
      if (!normalized) {
        throw new Error('Invalid movie payload.');
      }

      const movies = this.getMovies();
      const isDuplicate = movies.some((existing) => isSameArchiveItem(existing, normalized));
      if (isDuplicate) {
        throw new Error(`The resonance for "${movie.title}" is already persisted in the vault.`);
      }

      movies.push(normalized);
      this.persist(movies);
    } catch (error) {
      this.handleStorageError(error);
    }
  }

  /**
   * Removes a movie from local cache using the unified identity.
   */
  public static deleteMovie(
    title: string,
    releaseYear: number,
    mediaType: MediaType = 'movie',
    tmdbId?: number
  ): void {
    try {
      const movies = this.getMovies();
      const target = { title, releaseYear, mediaType, tmdbId };
      const filteredMovies = movies.filter((movie) => !isSameArchiveItem(movie, target));
      this.persist(filteredMovies);
    } catch (error) {
      console.error('Failed to delete from local cache:', error);
    }
  }

  /**
   * Updates a movie in local cache using the unified identity.
   */
  public static updateMovie(
    title: string,
    releaseYear: number,
    updates: Partial<VaultMovieRecord>,
    mediaType: MediaType = 'movie',
    tmdbId?: number
  ): void {
    try {
      const movies = this.getMovies();
      const target = { title, releaseYear, mediaType, tmdbId };
      const updatedMovies = movies.map((movie) => {
        if (!isSameArchiveItem(movie, target)) {
          return movie;
        }

        const updatedRecord = this.normalizeRecord({ ...movie, ...updates }).record;
        return updatedRecord ?? movie;
      });
      this.persist(updatedMovies);
    } catch (error) {
      console.error('Failed to update local cache:', error);
    }
  }

  /**
   * Exports the whole archive as JSON.
   */
  public static exportArchive(): string {
    const movies = this.getMovies();
    return JSON.stringify(
      {
        version: '1.1',
        exportedAt: new Date().toISOString(),
        movies,
      },
      null,
      2
    );
  }

  /**
   * Imports movies from JSON and merges while deduplicating with archive identity.
   */
  public static importArchive(jsonString: string): { imported: number; skipped: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.movies || !Array.isArray(data.movies)) {
        throw new Error('Invalid archive format.');
      }

      const mergedMovies = [...this.getMovies()];

      let imported = 0;
      let skipped = 0;

      for (const candidate of data.movies as RawVaultMovieRecord[]) {
        const normalized = this.normalizeRecord(candidate).record;
        if (!normalized) {
          throw new Error('Invalid movie format in archive. Missing required fields.');
        }

        const isDuplicate = mergedMovies.some((existing) => isSameArchiveItem(existing, normalized));
        if (isDuplicate) {
          skipped++;
          continue;
        }

        mergedMovies.push(normalized);
        imported++;
      }

      this.persist(mergedMovies);
      return { imported, skipped };
    } catch (error) {
      console.error('Failed to import archive:', error);
      throw new Error('The imported file is corrupted or incompatible with the astral records.');
    }
  }

  /**
   * Clears the entire local cache.
   */
  public static clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }

  private static deduplicate(movies: VaultMovieRecord[]): VaultMovieRecord[] {
    const deduped: VaultMovieRecord[] = [];
    for (const movie of movies) {
      const duplicate = deduped.some((existing) => isSameArchiveItem(existing, movie));
      if (!duplicate) {
        deduped.push(movie);
      }
    }
    return deduped;
  }

  private static normalizeRecord(raw: RawVaultMovieRecord): { record: VaultMovieRecord | null; didMigrate: boolean } {
    if (!raw || typeof raw !== 'object') {
      return { record: null, didMigrate: false };
    }

    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    const releaseYear =
      typeof raw.releaseYear === 'number' ? raw.releaseYear : Number.parseInt(String(raw.releaseYear), 10);

    if (!title || !Number.isFinite(releaseYear)) {
      return { record: null, didMigrate: false };
    }

    const mediaType = normalizeMediaType(raw.mediaType);
    const status = migrateViewingStatus(raw.status);

    const normalized: VaultMovieRecord = {
      title,
      releaseYear,
      narrativeJustification:
        typeof raw.narrativeJustification === 'string' ? raw.narrativeJustification : 'No curator context available.',
      mediaType,
      tmdbId: typeof raw.tmdbId === 'number' ? raw.tmdbId : undefined,
      posterUrl: typeof raw.posterUrl === 'string' ? raw.posterUrl : undefined,
      backdropUrl: typeof raw.backdropUrl === 'string' ? raw.backdropUrl : undefined,
      soundtrackHighlight: typeof raw.soundtrackHighlight === 'string' ? raw.soundtrackHighlight : undefined,
      timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
      status,
      userRating: typeof raw.userRating === 'number' ? raw.userRating : undefined,
      userNotes: typeof raw.userNotes === 'string' ? raw.userNotes : undefined,
    };

    const didMigrate =
      raw.mediaType !== normalized.mediaType ||
      raw.status !== normalized.status ||
      raw.timestamp !== normalized.timestamp ||
      raw.title !== normalized.title;

    return { record: normalized, didMigrate };
  }

  private static persist(movies: VaultMovieRecord[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(movies));
    } catch (error) {
      this.handleStorageError(error);
    }
  }

  private static handleStorageError(error: unknown): never {
    console.error('Storage Error:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('The vault is full. Please clear some resonances to make room for new echoes.');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while accessing the local device memory.');
  }
}
