/**
 * Unified Movie Domain Model
 * Architected for consistency across AI, Cache, and UI layers.
 */

export type ViewingStatus = 'pending' | 'watched' | 'archived';

export interface Movie {
  title: string;
  releaseYear: number;
  narrativeJustification: string;
  tmdbId?: number;
  posterUrl?: string;
  soundtrackHighlight?: string;
}

export interface VaultMovieRecord extends Movie {
  timestamp: string;
  status: ViewingStatus;
  userRating?: number;
  userNotes?: string;
}
