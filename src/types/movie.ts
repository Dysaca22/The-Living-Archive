/**
 * Unified Movie Domain Model
 * Architected for consistency across AI, Cache, and UI layers.
 */

export interface Movie {
  title: string;
  releaseYear: number;
  narrativeJustification: string;
  tmdbId?: number;
  posterUrl?: string;
  soundtrackHighlight?: string;
}

export interface CachedMovie extends Movie {
  timestamp: string;
}
