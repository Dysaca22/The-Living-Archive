import { useCallback, useEffect, useRef, useState } from 'react';
import { Movie } from '../../../types/movie';
import { fetchDailyHistoryRecommendation, fetchHistoryEventsForToday, getCurrentDayMonth } from '../services/homeHistoryService';

interface HistoryEvent {
  year: number;
  text: string;
}

interface SectionState {
  dayLabel: string;
  eventText: string;
  items: Movie[];
  loading: boolean;
  error: string | null;
}

function pickNextEventIndex(totalEvents: number, currentIndex: number | null): number {
  if (totalEvents <= 1) {
    return 0;
  }

  let candidate = Math.floor(Math.random() * totalEvents);
  if (candidate === currentIndex) {
    candidate = (candidate + 1) % totalEvents;
  }
  return candidate;
}

export function useOnThisDaySection() {
  const [state, setState] = useState<SectionState>({
    dayLabel: getCurrentDayMonth().label,
    eventText: '',
    items: [],
    loading: true,
    error: null,
  });

  const eventsRef = useRef<HistoryEvent[]>([]);
  const eventIndexRef = useRef<number | null>(null);

  const loadByIndex = useCallback(async (requestedIndex: number | null) => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: null }));

      const events = eventsRef.current.length > 0 ? eventsRef.current : await fetchHistoryEventsForToday();
      eventsRef.current = events;

      if (events.length === 0) {
        setState((previous) => ({
          ...previous,
          loading: false,
          eventText: '',
          items: [],
          error: null,
        }));
        eventIndexRef.current = null;
        return;
      }

      const selectedIndex =
        typeof requestedIndex === 'number'
          ? requestedIndex
          : pickNextEventIndex(events.length, eventIndexRef.current);

      const selectedEvent = events[selectedIndex];
      const recommendation = await fetchDailyHistoryRecommendation(selectedEvent);

      eventIndexRef.current = selectedIndex;
      setState({
        dayLabel: recommendation.dayLabel,
        eventText: `${recommendation.event.year}: ${recommendation.event.text}`,
        items: recommendation.items,
        loading: false,
        error: null,
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Error al cargar efemeride.';
      setState((previous) => ({
        ...previous,
        loading: false,
        items: [],
        error: message,
      }));
    }
  }, []);

  const regenerate = useCallback(async () => {
    const events = eventsRef.current;
    if (events.length === 0) {
      await loadByIndex(null);
      return;
    }
    const nextIndex = pickNextEventIndex(events.length, eventIndexRef.current);
    await loadByIndex(nextIndex);
  }, [loadByIndex]);

  useEffect(() => {
    void loadByIndex(null);
  }, [loadByIndex]);

  return {
    ...state,
    regenerate,
  };
}
