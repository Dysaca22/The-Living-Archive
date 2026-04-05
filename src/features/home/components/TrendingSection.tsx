import { RefreshCw } from 'lucide-react';
import { useTrendingSection } from '../hooks/useTrendingSection';
import { HomeSectionFrame } from './HomeSectionFrame';
import { HomeSectionGrid } from './HomeSectionGrid';
import { HomeSectionCardHandlers } from './sectionTypes';

export function TrendingSection(handlers: HomeSectionCardHandlers) {
  const { items, loading, error, reload } = useTrendingSection();

  return (
    <HomeSectionFrame
      title="Tendencia"
      subtitle="Seleccion en tendencia desde TMDB (fuente externa oficial) para esta semana."
      actions={
        <button
          onClick={() => void reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-primary/40 transition-colors font-mono text-[10px] uppercase tracking-widest"
        >
          <RefreshCw className="w-3 h-3" />
          Actualizar
        </button>
      }
    >
      <HomeSectionGrid
        items={items}
        loading={loading}
        error={error}
        emptyMessage="No hay titulos en tendencia por ahora."
        onInfo={handlers.onInfo}
        onSave={handlers.onSave}
        isSaved={handlers.isSaved}
        getStatus={handlers.getStatus}
      />
    </HomeSectionFrame>
  );
}
