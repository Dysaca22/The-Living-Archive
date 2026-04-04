import { useCallback, useEffect, useMemo, useState } from 'react';
import { MediaType, Movie, VaultMovieRecord, ViewingStatus } from '../../../types/movie';
import { LocalCacheService } from '../../../services/localCacheService';
import { PlatformStateManager } from '../../../services/platformStateManager';
import { MovieMappers } from '../../../mappers/movieMappers';
import { isSameArchiveItem } from '../utils/archiveIdentity';

export function useVault() {
  const [records, setRecords] = useState<VaultMovieRecord[]>([]);

  const refresh = useCallback(() => {
    setRecords(PlatformStateManager.evaluateCurrentStateSync());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveMovie = useCallback(
    async (movie: Movie) => {
      const record = MovieMappers.toVaultRecord(movie);
      await PlatformStateManager.syncToLocalCache(record);
      refresh();
    },
    [refresh]
  );

  const deleteMovie = useCallback(
    (title: string, releaseYear: number, mediaType: MediaType = 'movie', tmdbId?: number) => {
      LocalCacheService.deleteMovie(title, releaseYear, mediaType, tmdbId);
      refresh();
    },
    [refresh]
  );

  const updateStatus = useCallback(
    (
      title: string,
      releaseYear: number,
      status: ViewingStatus,
      mediaType: MediaType = 'movie',
      tmdbId?: number
    ) => {
      LocalCacheService.updateMovie(title, releaseYear, { status }, mediaType, tmdbId);
      refresh();
    },
    [refresh]
  );

  const updateRating = useCallback(
    (
      title: string,
      releaseYear: number,
      userRating: number,
      mediaType: MediaType = 'movie',
      tmdbId?: number
    ) => {
      LocalCacheService.updateMovie(title, releaseYear, { userRating }, mediaType, tmdbId);
      refresh();
    },
    [refresh]
  );

  const updateNotes = useCallback(
    (
      title: string,
      releaseYear: number,
      userNotes: string,
      mediaType: MediaType = 'movie',
      tmdbId?: number
    ) => {
      LocalCacheService.updateMovie(title, releaseYear, { userNotes }, mediaType, tmdbId);
      refresh();
    },
    [refresh]
  );

  const deleteMovieByReference = useCallback(
    (movie: Movie) => {
      deleteMovie(movie.title, movie.releaseYear, movie.mediaType, movie.tmdbId);
    },
    [deleteMovie]
  );

  const updateStatusByReference = useCallback(
    (movie: Movie, status: ViewingStatus) => {
      updateStatus(movie.title, movie.releaseYear, status, movie.mediaType, movie.tmdbId);
    },
    [updateStatus]
  );

  const updateRatingByReference = useCallback(
    (movie: Movie, userRating: number) => {
      updateRating(movie.title, movie.releaseYear, userRating, movie.mediaType, movie.tmdbId);
    },
    [updateRating]
  );

  const updateNotesByReference = useCallback(
    (movie: Movie, userNotes: string) => {
      updateNotes(movie.title, movie.releaseYear, userNotes, movie.mediaType, movie.tmdbId);
    },
    [updateNotes]
  );

  const clearVault = useCallback(() => {
    LocalCacheService.clearCache();
    refresh();
  }, [refresh]);

  const exportVault = useCallback(() => LocalCacheService.exportArchive(), []);

  const importVault = useCallback(
    (jsonString: string) => {
      const result = LocalCacheService.importArchive(jsonString);
      refresh();
      return result;
    },
    [refresh]
  );

  const isSaved = useCallback(
    (movie: Movie) => records.some((record) => isSameArchiveItem(record, movie)),
    [records]
  );

  const getRecord = useCallback(
    (movie: Movie | null) => {
      if (!movie) {
        return undefined;
      }
      return records.find((record) => isSameArchiveItem(record, movie));
    },
    [records]
  );

  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [records]
  );

  return {
    records: sortedRecords,
    refresh,
    saveMovie,
    deleteMovie,
    deleteMovieByReference,
    updateStatus,
    updateStatusByReference,
    updateRating,
    updateRatingByReference,
    updateNotes,
    updateNotesByReference,
    clearVault,
    exportVault,
    importVault,
    isSaved,
    getRecord,
  };
}
