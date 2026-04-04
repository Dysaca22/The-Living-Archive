import { MediaType, normalizeMediaType } from '../../../types/movie';

type ArchiveIdentityInput = {
  title: string;
  releaseYear: number;
  mediaType?: MediaType | string;
  tmdbId?: number;
};

export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

export function getArchiveIdentity(input: ArchiveIdentityInput): string {
  if (typeof input.tmdbId === 'number' && Number.isFinite(input.tmdbId)) {
    return `tmdb:${input.tmdbId}`;
  }

  const mediaType = normalizeMediaType(input.mediaType);
  return `fallback:${normalizeTitle(input.title)}::${input.releaseYear}::${mediaType}`;
}

export function isSameArchiveItem(a: ArchiveIdentityInput, b: ArchiveIdentityInput): boolean {
  if (
    typeof a.tmdbId === 'number' &&
    Number.isFinite(a.tmdbId) &&
    typeof b.tmdbId === 'number' &&
    Number.isFinite(b.tmdbId)
  ) {
    return a.tmdbId === b.tmdbId;
  }

  const aMediaType = normalizeMediaType(a.mediaType);
  const bMediaType = normalizeMediaType(b.mediaType);
  return (
    normalizeTitle(a.title) === normalizeTitle(b.title) &&
    a.releaseYear === b.releaseYear &&
    aMediaType === bMediaType
  );
}
