import { withSimpleCache } from './homeCache';
import { searchMediaByTextQuery } from './homeTmdbService';
import { Movie } from '../../../types/movie';

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

export interface DailyHistoryRecommendation {
  dayLabel: string;
  event: WikipediaOnThisDayEvent;
  items: Movie[];
}

const HISTORY_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
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
  'dia',
]);

function pad(value: number): string {
  return String(value).padStart(2, '0');
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
  const keywords = text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token) && Number.isNaN(Number(token)));

  if (keywords.length === 0) {
    return text.slice(0, 60);
  }
  return keywords.slice(0, 4).join(' ');
}

export async function fetchHistoryEventsForToday(date = new Date()): Promise<WikipediaOnThisDayEvent[]> {
  const { month, day, key } = getCurrentDayMonth(date);

  return withSimpleCache(`home:history:events:${key}`, HISTORY_CACHE_TTL_MS, async () => {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${pad(month)}/${pad(day)}`);
    if (!response.ok) {
      throw new Error('No fue posible obtener la efeméride del día.');
    }

    const payload = (await response.json()) as WikipediaOnThisDayResponse;
    return (payload.events ?? [])
      .filter((event) => typeof event.text === 'string' && typeof event.year === 'number')
      .map((event) => ({ year: event.year as number, text: event.text as string }));
  });
}

export async function fetchDailyHistoryRecommendation(event: WikipediaOnThisDayEvent, date = new Date()): Promise<DailyHistoryRecommendation> {
  const { label } = getCurrentDayMonth(date);
  const query = extractQueryFromEvent(event.text);
  const items = await searchMediaByTextQuery(`${query} ${event.year}`, `home:history:${label}`);

  return {
    dayLabel: label,
    event,
    items,
  };
}
