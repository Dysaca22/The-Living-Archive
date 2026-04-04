import { Movie, VaultMovieRecord } from '../../../types/movie';
import { isSameArchiveItem } from '../../vault/utils/archiveIdentity';
import { discoverMediaByGenres, fetchGenresForMedia, searchMediaByTextQuery } from './homeTmdbService';

function topGenresFromVault(records: VaultMovieRecord[]): Promise<number[]> {
  const genreFrequency = new Map<number, number>();
  const seedRecords = records.filter((record) => typeof record.tmdbId === 'number').slice(0, 8);

  return Promise.all(
    seedRecords.map(async (record) => {
      const genres = await fetchGenresForMedia(record.mediaType, record.tmdbId as number);
      genres.forEach((genreId) => {
        genreFrequency.set(genreId, (genreFrequency.get(genreId) ?? 0) + 1);
      });
    })
  ).then(() =>
    [...genreFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genreId]) => genreId)
  );
}

async function discoverFromGenres(genreIds: number[]): Promise<Movie[]> {
  if (genreIds.length === 0) {
    return [];
  }
  const [movieItems, tvItems] = await Promise.all([
    discoverMediaByGenres(
      'movie',
      genreIds,
      'home:recommended',
      'Recomendaciones en películas a partir de géneros de tu bóveda.'
    ),
    discoverMediaByGenres(
      'tv',
      genreIds,
      'home:recommended',
      'Recomendaciones en series a partir de géneros de tu bóveda.'
    ),
  ]);
  return [...movieItems, ...tvItems];
}

async function discoverFromTitles(records: VaultMovieRecord[]): Promise<Movie[]> {
  const titleSeed = records
    .slice(0, 6)
    .map((record) => record.title)
    .join(' ');
  if (!titleSeed) {
    return [];
  }
  return searchMediaByTextQuery(titleSeed, 'home:recommended:title-fallback');
}

export async function fetchPersonalizedSectionMedia(records: VaultMovieRecord[]): Promise<Movie[]> {
  if (records.length === 0) {
    return [];
  }

  const genreIds = await topGenresFromVault(records);
  const recommendations = (await discoverFromGenres(genreIds)).concat(await discoverFromTitles(records));

  const uniqueRecommendations: Movie[] = [];
  for (const recommendation of recommendations) {
    const alreadyInVault = records.some((record) => isSameArchiveItem(record, recommendation));
    const alreadySuggested = uniqueRecommendations.some((item) => isSameArchiveItem(item, recommendation));
    if (!alreadyInVault && !alreadySuggested) {
      uniqueRecommendations.push(recommendation);
    }
  }

  return uniqueRecommendations.slice(0, 12);
}
