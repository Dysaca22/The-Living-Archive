import type { MovieRecommendation } from '../../../schemas/movieSchema';
import { GeminiFlowError, GeminiService } from '../../../services/geminiService';
import { Movie } from '../../../types/movie';
import { withSimpleCache } from './homeCache';
import { fetchTrendingSectionMedia, searchMediaByTextQuery } from './homeTmdbService';

interface WikipediaOnThisDayEvent {
  year: number;
  text: string;
}

interface WikipediaOnThisDayResponse {
  events?: Array<{
    year?: number;
    text?: string;
  }>;
}

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

interface TmdbListResponse {
  results?: TmdbListItem[];
}

interface DailyHistoryRecommendationOptions {
  apiKey?: string | null;
  isGeminiReady?: boolean;
  generateRecommendations?: (
    userPrompt: string,
    historicalContext: string,
    existingTitles: string[],
    options?: { count?: number }
  ) => Promise<MovieRecommendation>;
}

type GeminiMovieRecommendation = MovieRecommendation[number];
type TmdbMediaType = 'movie' | 'tv';
type HistorySource = 'gemini' | 'fallback';

export interface DailyHistoryRecommendation {
  dayLabel: string;
  event: WikipediaOnThisDayEvent;
  items: Movie[];
  source: HistorySource;
  notice: string | null;
}

const HISTORY_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const HISTORY_SECTION_CACHE_TTL_MS = 30 * 60 * 1000;
const TMDB_CACHE_TTL_MS = 10 * 60 * 1000;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const HISTORY_MIN_RESULTS = 8;
const HISTORY_MAX_RESULTS = 12;
const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'into',
  'were',
  'was',
  'los',
  'las',
  'del',
  'de',
  'que',
  'por',
  'con',
  'para',
  'una',
  'un',
  'sobre',
  'entre',
  'como',
  'hoy',
  'día',
  'today',
  'year',
]);

const MONTH_LABELS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

  return {
    title,
    releaseYear,
    mediaType,
    tmdbId: item.id,
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : undefined,
    backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${item.backdrop_path}` : undefined,
    narrativeJustification: (item.overview || '').trim() || context,
  };
}

function toMovieIdentity(item: Movie): string {
  if (typeof item.tmdbId === 'number') {
    return `tmdb:${item.tmdbId}`;
  }
  return `title:${item.mediaType}:${normalizeText(item.title)}`;
}

function deduplicateMovies(items: Movie[]): Movie[] {
  const output: Movie[] = [];
  const seen = new Set<string>();

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

function historyLog(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const payload = meta ? { ...meta } : undefined;
  const prefix = `[HomeHistory] ${message}`;

  if (level === 'error') {
    console.error(prefix, payload);
    return;
  }
  if (level === 'warn') {
    console.warn(prefix, payload);
    return;
  }
  console.info(prefix, payload);
}

export function getCurrentDayMonth(date = new Date()): { month: number; day: number; key: string; label: string } {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return {
    month,
    day,
    key: `${pad(month)}-${pad(day)}`,
    label: `${pad(day)}/${pad(month)}`,
  };
}

function extractQueryFromEvent(text: string): string {
  const keywords = normalizeText(text)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token) && Number.isNaN(Number(token)));

  if (keywords.length === 0) {
    return text.slice(0, 60);
  }
  return keywords.slice(0, 5).join(' ');
}

function buildHistoryGeminiPrompt(event: WikipediaOnThisDayEvent, date: Date): { userPrompt: string; historicalContext: string } {
  const { label } = getCurrentDayMonth(date);
  const monthLabel = MONTH_LABELS[date.getMonth()] ?? MONTH_LABELS[0];

  return {
    userPrompt: [
      `Evento histórico del ${label}: ${event.year} - ${event.text}.`,
      'Recomienda cine y series conectados por contexto histórico, social o temático.',
      'Prioriza títulos reales y conocidos, mezcla clásicos y contemporáneos.',
      'No dependas de coincidencias exactas de fecha de estreno.',
      `Devuelve hasta ${HISTORY_MAX_RESULTS} resultados.`,
    ].join(' '),
    historicalContext: `Contexto del periodo actual: ${monthLabel}. Evento del día: ${event.year} - ${event.text}`,
  };
}

async function fetchTmdbList(
  cacheKey: string,
  endpoint: string,
  fallbackMediaType: TmdbMediaType,
  context: string,
  limit = 12
): Promise<Movie[]> {
  return withSimpleCache(cacheKey, TMDB_CACHE_TTL_MS, async () => {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`TMDB respondió con estado ${response.status}.`);
    }

    const payload = (await response.json()) as TmdbListResponse;
    const results = payload.results ?? [];
    return results
      .map((item) => toMovie(item, fallbackMediaType, context))
      .filter((item): item is Movie => Boolean(item))
      .slice(0, limit);
  });
}

async function fetchMovieByTmdbId(mediaType: TmdbMediaType, tmdbId: number, context: string): Promise<Movie | null> {
  return withSimpleCache(`home:history:detail:${mediaType}:${tmdbId}`, TMDB_CACHE_TTL_MS, async () => {
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

function withCuratorialNarrative(movie: Movie, narrative: string): Movie {
  if (!narrative.trim()) {
    return movie;
  }

  return {
    ...movie,
    narrativeJustification: narrative,
  };
}

function scoreCandidate(candidate: Movie, recommendation: GeminiMovieRecommendation, preferredType: TmdbMediaType): number {
  const expectedTitle = normalizeText(recommendation.title);
  const candidateTitle = normalizeText(candidate.title);
  let score = 0;

  if (candidateTitle === expectedTitle) {
    score += 6;
  } else if (candidateTitle.includes(expectedTitle) || expectedTitle.includes(candidateTitle)) {
    score += 3;
  }

  const yearGap = Math.abs(candidate.releaseYear - recommendation.release_year);
  if (yearGap === 0) {
    score += 3;
  } else if (yearGap <= 2) {
    score += 2;
  } else if (yearGap <= 4) {
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

function pickBestCandidate(
  candidates: Movie[],
  recommendation: GeminiMovieRecommendation,
  preferredType: TmdbMediaType
): Movie | null {
  let best: Movie | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = scoreCandidate(candidate, recommendation, preferredType);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

async function resolveGeminiHistoryItems(
  generateRecommendations: (
    userPrompt: string,
    historicalContext: string,
    existingTitles: string[],
    options?: { count?: number }
  ) => Promise<MovieRecommendation>,
  event: WikipediaOnThisDayEvent,
  date: Date
): Promise<Movie[]> {
  const { key } = getCurrentDayMonth(date);
  const { userPrompt, historicalContext } = buildHistoryGeminiPrompt(event, date);
  const generated = await generateRecommendations(userPrompt, historicalContext, [], {
    count: HISTORY_MAX_RESULTS,
  });

  const resolved = await Promise.all(
    generated.slice(0, HISTORY_MAX_RESULTS).map(async (recommendation, index) => {
    const preferredType: TmdbMediaType = recommendation.media_type === 'tv' ? 'tv' : 'movie';
      const context = recommendation.narrative_justification || `Relación histórica con el evento de ${event.year}.`;

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
        `home:history:gemini-search:${key}:${event.year}:${index}:${normalizeText(query)}`,
        `/api/tmdb/search/multi?query=${encodeURIComponent(query)}`,
        preferredType,
        context,
        10
      );

      const bestMatch = pickBestCandidate(searchResults, recommendation, preferredType);
      return bestMatch ? withCuratorialNarrative(bestMatch, recommendation.narrative_justification) : null;
    })
  );

  return deduplicateMovies(resolved.filter((item): item is Movie => Boolean(item)));
}

function buildFallbackQueries(event: WikipediaOnThisDayEvent, date: Date): string[] {
  const baseQuery = extractQueryFromEvent(event.text);
  const monthLabel = MONTH_LABELS[date.getMonth()] ?? MONTH_LABELS[0];
  const queries = [
    `${baseQuery} ${event.year}`,
    `${baseQuery} historical drama`,
    `${baseQuery} documentary`,
    `historical series ${monthLabel}`,
    `based on true story ${event.year}`,
  ];

  const seen = new Set<string>();
  const output: string[] = [];
  for (const query of queries) {
    const normalized = normalizeText(query);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    output.push(query);
  }

  return output;
}

async function resolveFallbackHistoryItems(event: WikipediaOnThisDayEvent, date: Date): Promise<Movie[]> {
  const { key } = getCurrentDayMonth(date);
  const fallbackQueries = buildFallbackQueries(event, date);

  const [searchBatches, movieDiscover, tvDiscover, trending] = await Promise.all([
    Promise.all(
      fallbackQueries.map(async (query, index) => {
        try {
          return await searchMediaByTextQuery(query, `home:history:fallback:query:${key}:${event.year}:${index}`);
        } catch (error) {
          historyLog('warn', 'Fallback histórico: fallo búsqueda por texto.', {
            query,
            message: error instanceof Error ? error.message : 'unknown',
          });
          return [];
        }
      })
    ),
    fetchTmdbList(
      `home:history:fallback:discover:movie:${key}:${event.year}`,
      '/api/tmdb/discover/movie?with_genres=18|36|99|10752&sort_by=popularity.desc&vote_count.gte=40&include_adult=false&page=1',
      'movie',
      `Obras históricas relacionadas con ${event.year}.`
    ).catch((error) => {
      historyLog('warn', 'Fallback histórico: fallo discover movie.', {
        message: error instanceof Error ? error.message : 'unknown',
      });
      return [];
    }),
    fetchTmdbList(
      `home:history:fallback:discover:tv:${key}:${event.year}`,
      '/api/tmdb/discover/tv?with_genres=18|99|10768|9648&sort_by=popularity.desc&vote_count.gte=20&include_adult=false&page=1',
      'tv',
      `Series históricas relacionadas con ${event.year}.`
    ).catch((error) => {
      historyLog('warn', 'Fallback histórico: fallo discover tv.', {
        message: error instanceof Error ? error.message : 'unknown',
      });
      return [];
    }),
    fetchTrendingSectionMedia().catch((error) => {
      historyLog('warn', 'Fallback histórico: fallo trending.', {
        message: error instanceof Error ? error.message : 'unknown',
      });
      return [];
    }),
  ]);

  return deduplicateMovies([...searchBatches.flat(), ...movieDiscover, ...tvDiscover, ...trending]);
}

function toEventCacheKey(event: WikipediaOnThisDayEvent): string {
  return `${event.year}:${normalizeText(event.text).slice(0, 80)}`;
}

export async function fetchHistoryEventsForToday(date = new Date()): Promise<WikipediaOnThisDayEvent[]> {
  const { month, day, key } = getCurrentDayMonth(date);

  return withSimpleCache(`home:history:events:${key}`, HISTORY_CACHE_TTL_MS, async () => {
    historyLog('info', 'Consultando eventos históricos del día.', { month, day });

    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${pad(month)}/${pad(day)}`);
    if (!response.ok) {
      historyLog('error', 'Wikipedia On This Day falló.', { status: response.status });
      throw new Error('No fue posible obtener la efeméride del día.');
    }

    const payload = (await response.json()) as WikipediaOnThisDayResponse;
    const events = (payload.events ?? [])
      .filter((event) => typeof event.text === 'string' && typeof event.year === 'number')
      .map((event) => ({ year: event.year as number, text: event.text as string }));

    historyLog('info', 'Eventos históricos cargados.', { totalEvents: events.length, key });
    return events;
  });
}

export async function fetchDailyHistoryRecommendation(
  event: WikipediaOnThisDayEvent,
  date = new Date(),
  options: DailyHistoryRecommendationOptions = {}
): Promise<DailyHistoryRecommendation> {
  const { label, key } = getCurrentDayMonth(date);
  const hasGemini = Boolean(options.isGeminiReady && options.apiKey && options.apiKey.trim());
  const eventKey = toEventCacheKey(event);

  return withSimpleCache(
    `home:history:daily:${key}:${eventKey}:${hasGemini ? 'gemini' : 'fallback'}`,
    HISTORY_SECTION_CACHE_TTL_MS,
    async () => {
      historyLog('info', 'Construyendo sección histórica del día.', {
        dayKey: key,
        eventYear: event.year,
        hasGemini,
      });

      let geminiItems: Movie[] = [];
      let notice: string | null = null;

      if (hasGemini && options.apiKey) {
        try {
          const generateRecommendations =
            options.generateRecommendations ??
            ((userPrompt: string, historicalContext: string, existingTitles: string[], config?: { count?: number }) =>
              GeminiService.generateRecommendations(options.apiKey as string, userPrompt, historicalContext, existingTitles, config));

          geminiItems = await resolveGeminiHistoryItems(generateRecommendations, event, date);
          historyLog('info', 'Curaduría histórica generada con Gemini.', {
            eventYear: event.year,
            items: geminiItems.length,
          });
        } catch (error) {
          const normalizedError =
            error instanceof GeminiFlowError
              ? error
              : new GeminiFlowError('Fallo inesperado en curaduría histórica con Gemini.', 'unknown');

          notice = 'Gemini tuvo un fallo temporal. Mostramos una selección histórica alternativa.';
          historyLog('warn', 'Gemini falló en sección histórica, activando fallback.', {
            code: normalizedError.code,
            message: normalizedError.message,
          });
        }
      } else {
        notice = 'Configura Gemini para curaduría histórica asistida. Mientras tanto usamos una selección alternativa.';
        historyLog('info', 'Gemini no configurado para sección histórica. Se usa fallback.');
      }

      const fallbackItems = await resolveFallbackHistoryItems(event, date);
      const combinedItems = deduplicateMovies([...geminiItems, ...fallbackItems]);

      if (combinedItems.length === 0) {
        historyLog('error', 'Sección histórica sin resultados después de fallback.', {
          eventYear: event.year,
        });
        throw new Error('No fue posible construir recomendaciones históricas para hoy.');
      }

      const targetCount = clamp(10, HISTORY_MIN_RESULTS, HISTORY_MAX_RESULTS);
      const items = combinedItems.slice(0, targetCount);
      const source: HistorySource = geminiItems.length > 0 ? 'gemini' : 'fallback';

      if (source === 'gemini' && items.length < HISTORY_MIN_RESULTS) {
        notice = 'Completamos la curaduría con una selección alternativa para mantener variedad.';
      }

      return {
        dayLabel: label,
        event,
        items,
        source,
        notice,
      };
    }
  );
}
