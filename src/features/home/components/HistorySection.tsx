import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useOnThisDaySection } from '../hooks/useOnThisDaySection';
import { HomeSectionFrame } from './HomeSectionFrame';
import { HomeSectionGrid } from './HomeSectionGrid';
import { HomeSectionCardHandlers } from './sectionTypes';

export function HistorySection(handlers: HomeSectionCardHandlers) {
  const {
    dayLabel,
    eventText,
    items,
    loading,
    error,
    notice,
    regenerate,
    needsGeminiSetup,
    setupMessage,
  } = useOnThisDaySection();

  return (
    <HomeSectionFrame
      title="En este día de la historia"
      subtitle={
        eventText
          ? `${dayLabel}: ${eventText}${notice ? ` ${notice}` : ''}`
          : `Cargando efeméride del ${dayLabel} para descubrir títulos relacionados.`
      }
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => void regenerate()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-primary/40 transition-colors font-mono text-[10px] uppercase tracking-widest"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerar efeméride
          </button>
          {needsGeminiSetup && (
            <Link
              to="/buscar"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 hover:border-primary/60 transition-colors font-mono text-[10px] uppercase tracking-widest text-primary"
            >
              Configurar Gemini
            </Link>
          )}
        </div>
      }
    >
      {needsGeminiSetup && setupMessage && (
        <div className="mb-4 text-xs text-primary/80 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          {setupMessage}
        </div>
      )}
      <HomeSectionGrid
        items={items}
        loading={loading}
        error={error}
        emptyMessage="No hay resultados relacionados con la efeméride actual. Puedes regenerar para probar otro hecho del mismo día."
        onInfo={handlers.onInfo}
        onSave={handlers.onSave}
        isSaved={handlers.isSaved}
        getStatus={handlers.getStatus}
      />
    </HomeSectionFrame>
  );
}
