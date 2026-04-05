import { useCallback, useEffect, useRef, useState } from 'react';
import { useGeminiCredentials } from '../../../hooks/useGeminiCredentials';
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
  notice: string | null;
  source: 'gemini' | 'fallback';
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
  const {
    apiKey,
    isReady,
    validationStatus,
    validationError,
    generateRecommendations,
  } = useGeminiCredentials();

  const [state, setState] = useState<SectionState>({
    dayLabel: getCurrentDayMonth().label,
    eventText: '',
    items: [],
    loading: true,
    error: null,
    notice: null,
    source: 'fallback',
  });

  const eventsRef = useRef<HistoryEvent[]>([]);
  const eventIndexRef = useRef<number | null>(null);
  const dayKeyRef = useRef<string>(getCurrentDayMonth().key);

  const loadByIndex = useCallback(
    async (requestedIndex: number | null) => {
      const now = new Date();
      const dayInfo = getCurrentDayMonth(now);
      if (dayKeyRef.current !== dayInfo.key) {
        dayKeyRef.current = dayInfo.key;
        eventsRef.current = [];
        eventIndexRef.current = null;
      }

      try {
        setState((previous) => ({
          ...previous,
          dayLabel: dayInfo.label,
          loading: true,
          error: null,
          notice: null,
        }));

        const events = eventsRef.current.length > 0 ? eventsRef.current : await fetchHistoryEventsForToday(now);
        eventsRef.current = events;

        if (events.length === 0) {
          setState((previous) => ({
            ...previous,
            loading: false,
            eventText: '',
            items: [],
            source: 'fallback',
            notice: 'No encontramos efemérides para la fecha actual.',
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
        const eventText = `${selectedEvent.year}: ${selectedEvent.text}`;

        setState((previous) => ({
          ...previous,
          dayLabel: dayInfo.label,
          eventText,
          loading: true,
          error: null,
        }));

        const recommendation = await fetchDailyHistoryRecommendation(selectedEvent, now, {
          apiKey,
          isGeminiReady: isReady && validationStatus !== 'invalid',
          generateRecommendations,
        });

        eventIndexRef.current = selectedIndex;
        setState({
          dayLabel: recommendation.dayLabel,
          eventText,
          items: recommendation.items,
          loading: false,
          error: null,
          notice: recommendation.notice,
          source: recommendation.source,
        });
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : 'Error al cargar la sección de En este día de la historia.';

        console.error('[HomeHistoryHook] No se pudo cargar la sección histórica.', {
          message,
          dayLabel: dayInfo.label,
          requestedIndex,
        });

        setState((previous) => ({
          ...previous,
          dayLabel: dayInfo.label,
          loading: false,
          items: [],
          source: 'fallback',
          notice: previous.eventText
            ? 'Mostramos el hecho histórico del día, pero no pudimos cargar títulos relacionados.'
            : previous.notice,
          error: message,
        }));
      }
    },
    [apiKey, generateRecommendations, isReady, validationStatus]
  );

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

  const needsGeminiSetup = !isReady || validationStatus === 'invalid';
  const setupMessage =
    validationStatus === 'invalid'
      ? validationError || 'La clave de Gemini no es válida.'
      : !isReady
      ? 'Configura tu clave Gemini para activar curaduría histórica asistida.'
      : null;

  return {
    ...state,
    regenerate,
    isGeminiReady: isReady && validationStatus !== 'invalid',
    needsGeminiSetup,
    setupMessage,
    validationStatus,
    validationError,
  };
}
