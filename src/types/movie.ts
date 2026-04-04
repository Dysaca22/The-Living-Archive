/**
 * Unified media domain model used across AI, cache and UI layers.
 */

export type MediaType = 'movie' | 'tv';
export type ViewingStatus = 'no_visto' | 'en_proceso' | 'visto';
export type LegacyViewingStatus = 'pending' | 'watched' | 'archived';

export interface Movie {
  title: string;
  releaseYear: number;
  narrativeJustification: string;
  mediaType: MediaType;
  tmdbId?: number;
  posterUrl?: string;
  backdropUrl?: string;
  soundtrackHighlight?: string;
}

export interface VaultMovieRecord extends Movie {
  timestamp: string;
  status: ViewingStatus;
  userRating?: number;
  userNotes?: string;
}

export interface PublicReview {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  authorRating?: number;
  url?: string;
}

export interface MediaSeasonSummary {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate?: string;
  posterUrl?: string;
}

export interface MediaCollectionSummary {
  id: number;
  name: string;
  items: Movie[];
}

export interface MediaPublicMetrics {
  voteAverage?: number;
  voteCount?: number;
}

export interface MediaDetail {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterUrl?: string;
  backdropUrl?: string;
  homepage?: string;
  genres: string[];
  publicMetrics: MediaPublicMetrics;
  publicReviews: PublicReview[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasons: MediaSeasonSummary[];
  collection?: MediaCollectionSummary;
}

export function normalizeMediaType(mediaType: string | undefined | null): MediaType {
  return mediaType === 'tv' ? 'tv' : 'movie';
}

export function migrateViewingStatus(
  status: ViewingStatus | LegacyViewingStatus | string | undefined | null
): ViewingStatus {
  switch (status) {
    case 'pending':
      return 'no_visto';
    case 'watched':
    case 'archived':
      return 'visto';
    case 'en_proceso':
    case 'visto':
    case 'no_visto':
      return status;
    default:
      return 'no_visto';
  }
}
