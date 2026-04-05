import type { MovieRecommendation } from '../../../schemas/movieSchema';
import { Movie } from '../../../types/movie';
import { withSimpleCache } from './homeCache';
import { getSeasonalSignals, SeasonalSignals } from './seasonalSignals';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const CACHE_TTL_MS = 10 * 60 * 1000;
const SEASONAL_POOL_TTL_MS = 30 * 60 * 1000;
const DEFAULT_SEASONAL_MIN_ITEMS = 8;
const DEFAULT_SEASONAL_MAX_ITEMS = 12;

type TmdbMediaType = 'movie' | 'tv';
type SeasonalSource = 'gemini' | 'editorial' | 'genre' | 'trending';

type GeminiRecommendation = MovieRecommendation[number];

interface TmdbListItem {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbDetailsResponse {
  genres?: TmdbGenre[];
}

interface TmdbListResponse {
  results?: TmdbListItem[];
}

interface ApiErrorPayload {
  error?: string;
}

interface SeasonalCandidate {
  movie: Movie;
  source: SeasonalSource;
}

export interface SeasonalSectionOptions {
  apiKey?: string | null;
  minItems?: number;
  maxItems?: number;
  variantSeed?: number;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeYear(rawDate: string | undefined): number {
  if (!rawDate) {
    return new Date().getFullYear();
  }
  const year = Number.parseInt(rawDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function toMovie(item: TmdbListItem, fallbackMediaType: TmdbMediaType, context: string): Movie | null {
  const mediaType = item.media_type === 'tv' || item.media_type === 'movie' ? item.media_type : fallbackMediaType;
  if (item.media_type === 'person') {
    return null;
  }

  const title = mediaType === 'tv' ? item.name : item.title;
  if (!title) {
    return null;
  }

  const releaseYear = mediaType === 'tv' ? sanitizeYear(item.first_air_date) : sanitizeYear(item.release_date);
  const overview = (item.overview || '').trim();

  return {
    title,
    releaseYear,
    mediaType,
    tmdbId: item.id,
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : undefined,
    backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${item.backdrop_path}` : undefined,
    narrativeJustification: overview || context,
  };
}

function withCuratorialNarrative(movie: Movie, narrative: string | undefined): Movie {
  if (!narrative || !narrative.trim()) {
    return movie;
  }
  return {
    ...movie,
    narrativeJustification: narrative,
  };
}

function toMovieIdentity(item: Movie): string {
  if (typeof item.tmdbId === 'number') {
    return `tmdb:${item.tmdbId}`;
  }
  return `title:${item.mediaType}:${normalizeText(item.title)}`;
}

function deduplicateMovies(items: Movie[]): Movie[] {
  const seen = new Set<string>();
  const output: Movie[] = [];

  for (const item of items) {
    const identity = toMovieIdentity(item);
    if (seen.has(identity)) {
      continue;
    }
    seen.add(identity);
    output.push(item);
  }

  return output;
}

async function readApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // ignore JSON parse failures for error payloads
  }

  return `TMDB respondió con estado ${response.status}.`;
}

async function fetchTmdbList(
  cacheKey: string,
  endpoint: string,
  fallbackMediaType: TmdbMediaType,
  context: string,
  limit = 12
): Promise<Movie[]> {
  return withSimpleCache(cacheKey, CACHE_TTL_MS, async () => {
    const response = await fetch(endpoint);
    if (!response.ok) {
      const errorMessage = await readApiError(response);
      if (response.status === 503) {
        throw new Error(
          `${errorMessage} Configura TMDB_READ_ACCESS_TOKEN en tu archivo .env y reinicia npm run dev.`
        );
      }
      throw new Error(errorMessage);
    }

    const payload = (await response.json()) as TmdbListResponse;
    const results = payload.results ?? [];
    return results
      .map((item) => toMovie(item, fallbackMediaType, context))
      .filter((item): item is Movie => Boolean(item))
      .slice(0, limit);
  });
}

function toGenreOrFilter(genreIds: number[]): string {
  return [...new Set(genreIds.filter((id) => Number.isFinite(id) && id > 0))].join('|');
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

async function getSeasonalSignalsCached(date: Date): Promise<SeasonalSignals> {
  const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return withSimpleCache(`home:seasonal:signals:${dayKey}`, SEASONAL_POOL_TTL_MS, async () => getSeasonalSignals(date));
}

async function capturePool(
  label: string,
  fetcher: () => Promise<Movie[]>,
  failures: string[]
): Promise<Movie[]> {
  try {
    return await fetcher();
  } catch (error) {
    const message = error instanceof Error ? error.message : `No se pudo resolver ${label}.`;
    failures.push(message);
    return [];
  }
}

async function fetchSeasonalGenrePool(signals: SeasonalSignals): Promise<Movie[]> {
  const movieGenreFilter = toGenreOrFilter(signals.movieGenreIds);
  const tvGenreFilter = toGenreOrFilter(signals.tvGenreIds);
  const movieBaseQuery =
    `/api/tmdb/discover/movie?with_genres=${encodeURIComponent(movieGenreFilter)}` +
    '&sort_by=popularity.desc&vote_count.gte=40&include_adult=false';
  const tvBaseQuery =
    `/api/tmdb/discover/tv?with_genres=${encodeURIComponent(tvGenreFilter)}` +
    '&sort_by=popularity.desc&vote_count.gte=20&include_adult=false';

  const [moviePage1, moviePage2, tvPage1, tvPage2] = await Promise.all([
    fetchTmdbList(
      `home:seasonal:genre:movie:${signals.cacheKey}:p1`,
      `${movieBaseQuery}&page=1`,
      'movie',
      'Selección estacional de películas.'
    ),
    fetchTmdbList(
      `home:seasonal:genre:movie:${signals.cacheKey}:p2`,
      `${movieBaseQuery}&page=2`,
      'movie',
      'Selección estacional de películas.'
    ),
    fetchTmdbList(
      `home:seasonal:genre:tv:${signals.cacheKey}:p1`,
      `${tvBaseQuery}&page=1`,
      'tv',
      'Selección estacional de series.'
    ),
    fetchTmdbList(
      `home:seasonal:genre:tv:${signals.cacheKey}:p2`,
      `${tvBaseQuery}&page=2`,
      'tv',
      'Selección estacional de series.'
    ),
  ]);

  return deduplicateMovies([...moviePage1, ...moviePage2, ...tvPage1, ...tvPage2]);
}

async function fetchSeasonalEditorialPool(signals: SeasonalSignals): Promise<Movie[]> {
  const editorialQueries = signals.editorialQueries.slice(0, 6);
  const batches = await Promise.all(
    editorialQueries.map((query, index) =>
      searchMediaByTextQuery(query, `home:seasonal:editorial:${signals.cacheKey}:${index}`)
    )
  );
  return deduplicateMovies(batches.flat());
}

function buildGeminiSeasonalInputs(signals: SeasonalSignals, count: number): {
  userPrompt: string;
  historicalContext: string;
} {
  const moments = signals.culturalMoments.join(', ') || 'sin festividad principal';
  const themes = signals.thematicPillars.join(', ');
  const monthContext = `${signals.monthLabel} (${signals.dayKey})`;

  return {
    userPrompt: [
      `Curaduría estacional para ${monthContext}.`,
      `Momento cultural relevante: ${moments}.`,
      `Temas del periodo: ${themes}.`,
      `Prioriza títulos reales y populares entre películas y series.`,
      `Entrega máximo ${count} resultados, con mezcla de clásicos y contemporáneos.`,
    ].join(' '),
    historicalContext: `Contexto de temporada: ${signals.sectionSubtitle}`,
  };
}

async function fetchMovieByTmdbId(mediaType: TmdbMediaType, tmdbId: number, context: string): Promise<Movie | null> {
  return withSimpleCache(`home:tmdb:item:${mediaType}:${tmdbId}`, CACHE_TTL_MS, async () => {
    const response = await fetch(`/api/tmdb/${mediaType}/${tmdbId}`);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as TmdbListItem;
    return toMovie(
      {
        id: payload.id,
        media_type: mediaType,
        title: payload.title,
        name: payload.name,
        release_date: payload.release_date,
        first_air_date: payload.first_air_date,
        overview: payload.overview,
        poster_path: payload.poster_path,
        backdrop_path: payload.backdrop_path,
      },
      mediaType,
      context
    );
  });
}

function scoreGeminiMatch(candidate: Movie, recommendation: GeminiRecommendation, preferredType: TmdbMediaType): number {
  const recommendationTitle = normalizeText(recommendation.title);
  const candidateTitle = normalizeText(candidate.title);
  let score = 0;

  if (candidateTitle === recommendationTitle) {
    score += 6;
  } else if (candidateTitle.includes(recommendationTitle) || recommendationTitle.includes(candidateTitle)) {
    score += 3;
  }

  const yearGap = Math.abs(candidate.releaseYear - recommendation.release_year);
  if (yearGap === 0) {
    score += 3;
  } else if (yearGap <= 1) {
    score += 2;
  } else if (yearGap <= 3) {
    score += 1;
  }

  if (candidate.mediaType === preferredType) {
    score += 1;
  }
  if (candidate.posterUrl) {
    score += 1;
  }
  if (candidate.backdropUrl) {
    score += 1;
  }

  return score;
}

function pickBestGeminiMatch(
  candidates: Movie[],
  recommendation: GeminiRecommendation,
  preferredType: TmdbMediaType
): Movie | null {
  let best: Movie | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = scoreGeminiMatch(candidate, recommendation, preferredType);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

async function resolveGeminiRecommendations(apiKey: string, signals: SeasonalSignals): Promise<Movie[]> {
  const recommendationCount = 8;
  const { userPrompt, historicalContext } = buildGeminiSeasonalInputs(signals, recommendationCount);
  let generated: GeminiRecommendation[];
  const { GeminiService } = await import('../../../services/geminiService');

  try {
    generated = await GeminiService.generateRecommendations(
      apiKey,
      userPrompt,
      historicalContext,
      [],
      { count: recommendationCount }
    );
  } catch (error) {
    console.warn('No se pudo generar curaduría estacional con Gemini:', error);
    return [];
  }

  const resolved = await Promise.all(
    generated.slice(0, recommendationCount).map(async (recommendation, index) => {
      const preferredType: TmdbMediaType = recommendation.media_type === 'tv' ? 'tv' : 'movie';
      const context = recommendation.narrative_justification || `Curaduría estacional para ${signals.monthLabel}.`;

      if (typeof recommendation.tmdb_database_id === 'number') {
        const byId =
          (await fetchMovieByTmdbId(preferredType, recommendation.tmdb_database_id, context)) ??
          (await fetchMovieByTmdbId(preferredType === 'movie' ? 'tv' : 'movie', recommendation.tmdb_database_id, context));
        if (byId) {
          return withCuratorialNarrative(byId, recommendation.narrative_justification);
        }
      }

      const query = `${recommendation.title} ${recommendation.release_year}`.trim();
      const searchResults = await fetchTmdbList(
        `home:seasonal:gemini-search:${signals.cacheKey}:${index}:${normalizeText(query)}`,
        `/api/tmdb/search/multi?query=${encodeURIComponent(query)}`,
        preferredType,
        context,
        10
      );

      const bestMatch = pickBestGeminiMatch(searchResults, recommendation, preferredType);
      return bestMatch ? withCuratorialNarrative(bestMatch, recommendation.narrative_justification) : null;
    })
  );

  return deduplicateMovies(resolved.filter((item): item is Movie => Boolean(item)));
}

function sourceWeight(source: SeasonalSource): number {
  switch (source) {
    case 'gemini':
      return 5;
    case 'editorial':
      return 4;
    case 'genre':
      return 3;
    case 'trending':
      return 2;
    default:
      return 1;
  }
}

function visualScore(movie: Movie): number {
  let score = 0;
  if (movie.posterUrl) {
    score += 2;
  }
  if (movie.backdropUrl) {
    score += 1;
  }
  return score;
}

function buildThemeTokens(signals: SeasonalSignals): string[] {
  const rawTokens = [...signals.culturalMoments, ...signals.thematicPillars]
    .flatMap((item) => normalizeText(item).split(' '))
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);

  return [...new Set(rawTokens)];
}

function themeRelevanceScore(movie: Movie, themeTokens: string[]): number {
  if (themeTokens.length === 0) {
    return 0;
  }

  const haystack = normalizeText(`${movie.title} ${movie.narrativeJustification}`);
  let score = 0;
  for (const token of themeTokens) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }
  return Math.min(score, 5);
}

function rankSeasonalCandidates(candidates: SeasonalCandidate[], signals: SeasonalSignals): Movie[] {
  const themeTokens = buildThemeTokens(signals);
  const ranked = [...candidates].sort((a, b) => {
    const scoreA =
      sourceWeight(a.source) * 10 +
      themeRelevanceScore(a.movie, themeTokens) * 4 +
      visualScore(a.movie);
    const scoreB =
      sourceWeight(b.source) * 10 +
      themeRelevanceScore(b.movie, themeTokens) * 4 +
      visualScore(b.movie);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return b.movie.releaseYear - a.movie.releaseYear;
  });

  return deduplicateMovies(ranked.map((entry) => entry.movie));
}

function rotateByVariant(items: Movie[], variantSeed: number): Movie[] {
  if (items.length <= 1 || variantSeed === 0) {
    return items;
  }

  const normalizedSeed = Math.abs(variantSeed) % items.length;
  if (normalizedSeed === 0) {
    return items;
  }
  return [...items.slice(normalizedSeed), ...items.slice(0, normalizedSeed)];
}

function selectSeasonalItems(
  rankedItems: Movie[],
  variantSeed: number,
  minItems: number,
  maxItems: number
): Movie[] {
  if (rankedItems.length === 0) {
    return [];
  }

  const targetCount = clamp(12, minItems, maxItems);
  const rotated = rotateByVariant(rankedItems, variantSeed);
  const selected = rotated.slice(0, targetCount);

  if (selected.length >= minItems) {
    return selected;
  }

  return rankedItems.slice(0, Math.min(rankedItems.length, minItems));
}

export async function fetchTrendingSectionMedia(): Promise<Movie[]> {
  return fetchTmdbList(
    'home:trending:all:week',
    '/api/tmdb/trending/all/week',
    'movie',
    'Contenido en tendencia global esta semana.'
  );
}

export async function fetchSeasonalSectionMedia(
  date: Date,
  options: SeasonalSectionOptions = {}
): Promise<{ title: string; subtitle: string; items: Movie[] }> {
  const signals = await getSeasonalSignalsCached(date);
  const hasGemini = Boolean(options.apiKey && options.apiKey.trim());
  const minItems = clamp(options.minItems ?? DEFAULT_SEASONAL_MIN_ITEMS, 8, 16);
  const maxItems = clamp(options.maxItems ?? DEFAULT_SEASONAL_MAX_ITEMS, minItems, 16);
  const variantSeed = Number.isFinite(options.variantSeed) ? Number(options.variantSeed) : 0;

  const rankedPool = await withSimpleCache(
    `home:seasonal:v3:pool:${signals.cacheKey}:${hasGemini ? 'gemini' : 'fallback'}`,
    SEASONAL_POOL_TTL_MS,
    async () => {
      const failures: string[] = [];
      const [genrePool, editorialPool, trendingPool, geminiPool] = await Promise.all([
        capturePool('pool de género', () => fetchSeasonalGenrePool(signals), failures),
        capturePool('pool editorial', () => fetchSeasonalEditorialPool(signals), failures),
        capturePool('pool de tendencia', () => fetchTrendingSectionMedia(), failures),
        hasGemini && options.apiKey
          ? capturePool('pool Gemini', () => resolveGeminiRecommendations(options.apiKey as string, signals), failures)
          : Promise.resolve([] as Movie[]),
      ]);

      const candidates: SeasonalCandidate[] = [
        ...geminiPool.map((movie) => ({ movie, source: 'gemini' as const })),
        ...editorialPool.map((movie) => ({ movie, source: 'editorial' as const })),
        ...genrePool.map((movie) => ({ movie, source: 'genre' as const })),
        ...trendingPool.map((movie) => ({ movie, source: 'trending' as const })),
      ];

      if (candidates.length === 0) {
        if (failures.length > 0) {
          throw new Error(failures[0]);
        }
        throw new Error('No pudimos construir la curaduría estacional de hoy.');
      }

      return rankSeasonalCandidates(candidates, signals);
    }
  );

  const items = selectSeasonalItems(rankedPool, variantSeed, minItems, maxItems);
  if (items.length === 0) {
    throw new Error('No encontramos títulos suficientes para esta época. Intenta regenerar la sección.');
  }

  const modeLabel = hasGemini
    ? 'Curaduría asistida por Gemini y validada con TMDB.'
    : 'Curaduría editorial de TMDB (sin clave Gemini).';

  return {
    title: signals.sectionTitle,
    subtitle: `${signals.sectionSubtitle} ${modeLabel}`,
    items,
  };
}

export async function searchMediaByTextQuery(query: string, cachePrefix = 'home:query'): Promise<Movie[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  return fetchTmdbList(
    `${cachePrefix}:${normalizeText(trimmedQuery)}`,
    `/api/tmdb/search/multi?query=${encodeURIComponent(trimmedQuery)}`,
    'movie',
    `Resultados asociados a "${trimmedQuery}".`
  );
}

export async function discoverMediaByGenres(
  mediaType: TmdbMediaType,
  genreIds: number[],
  cachePrefix: string,
  context: string
): Promise<Movie[]> {
  if (genreIds.length === 0) {
    return [];
  }

  const genreParam = genreIds.join(',');
  return fetchTmdbList(
    `${cachePrefix}:${mediaType}:${genreParam}`,
    `/api/tmdb/discover/${mediaType}?with_genres=${genreParam}&sort_by=popularity.desc&vote_count.gte=120`,
    mediaType,
    context
  );
}

export async function fetchGenresForMedia(mediaType: TmdbMediaType, tmdbId: number): Promise<number[]> {
  return withSimpleCache(`home:detail:${mediaType}:${tmdbId}`, CACHE_TTL_MS, async () => {
    const response = await fetch(`/api/tmdb/${mediaType}/${tmdbId}`);
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as TmdbDetailsResponse;
    return (payload.genres ?? []).map((genre) => genre.id);
  });
}
