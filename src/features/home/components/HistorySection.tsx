import { RefreshCw } from 'lucide-react';
import { useOnThisDaySection } from '../hooks/useOnThisDaySection';
import { HomeSectionFrame } from './HomeSectionFrame';
import { HomeSectionGrid } from './HomeSectionGrid';
import { HomeSectionCardHandlers } from './sectionTypes';

export function HistorySection(handlers: HomeSectionCardHandlers) {
  const { dayLabel, eventText, items, loading, error, regenerate } = useOnThisDaySection();

  return (
    <HomeSectionFrame
      title="En este día de la historia"
      subtitle={
        eventText
          ? `${dayLabel}: ${eventText}`
          : `Cargando efeméride del ${dayLabel} para descubrir títulos relacionados.`
      }
      actions={
        <button
          onClick={() => void regenerate()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-primary/40 transition-colors font-mono text-[10px] uppercase tracking-widest"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerar efeméride
        </button>
      }
    >
      <HomeSectionGrid
        items={items}
        loading={loading}
        error={error}
        emptyMessage="No hay resultados relacionados con la efeméride actual."
        onInfo={handlers.onInfo}
        onSave={handlers.onSave}
        isSaved={handlers.isSaved}
        getStatus={handlers.getStatus}
      />
    </HomeSectionFrame>
  );
}
