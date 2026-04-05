import { Movie } from '../../../types/movie';
import { discoverMediaByGenres, searchMediaByTextQuery } from '../../home/services/homeTmdbService';
import { CategoryDefinition } from '../config/categoryConfig';

export interface CategoryDiscoveryResult {
  items: Movie[];
  strategyLabel: string;
}

function deduplicateMovies(items: Movie[]): Movie[] {
  const uniqueItems: Movie[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const identity =
      typeof item.tmdbId === 'number'
        ? `tmdb:${item.tmdbId}`
        : `${item.mediaType}:${item.title.toLowerCase().trim()}:${item.releaseYear}`;

    if (seen.has(identity)) {
      continue;
    }

    seen.add(identity);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

async function discoverByGenres(category: CategoryDefinition): Promise<CategoryDiscoveryResult> {
  if (category.discovery.type !== 'genres') {
    throw new Error('Estrategia de descubrimiento por genero invalida.');
  }

  const [movieItems, tvItems] = await Promise.all([
    discoverMediaByGenres(
      'movie',
      category.discovery.movieGenres,
      `category:${category.slug}`,
      `Seleccion de ${category.label} en peliculas.`
    ),
    discoverMediaByGenres(
      'tv',
      category.discovery.tvGenres,
      `category:${category.slug}`,
      `Seleccion de ${category.label} en series.`
    ),
  ]);

  return {
    items: deduplicateMovies([...movieItems, ...tvItems]).slice(0, 18),
    strategyLabel: category.discovery.rationale,
  };
}

async function discoverEditorial(category: CategoryDefinition): Promise<CategoryDiscoveryResult> {
  if (category.discovery.type !== 'editorial') {
    throw new Error('Estrategia editorial de descubrimiento invalida.');
  }

  const queryResults = await Promise.all(
    category.discovery.seedQueries.map((query, index) =>
      searchMediaByTextQuery(query, `category:${category.slug}:editorial:${index}`)
    )
  );

  return {
    items: deduplicateMovies(queryResults.flat()).slice(0, 18),
    strategyLabel: category.discovery.rationale,
  };
}

export async function discoverCategoryContent(category: CategoryDefinition): Promise<CategoryDiscoveryResult> {
  if (category.discovery.type === 'genres') {
    return discoverByGenres(category);
  }

  return discoverEditorial(category);
}
