import { RefreshCw } from 'lucide-react';
import { useSeasonalSection } from '../hooks/useSeasonalSection';
import { HomeSectionFrame } from './HomeSectionFrame';
import { HomeSectionGrid } from './HomeSectionGrid';
import { HomeSectionCardHandlers } from './sectionTypes';

export function SeasonalSection(handlers: HomeSectionCardHandlers) {
  const { title, subtitle, items, loading, error, reload } = useSeasonalSection();

  return (
    <HomeSectionFrame
      title="Filmes de esta época del año"
      subtitle={`${title}. ${subtitle}`}
      actions={
        <button
          onClick={() => void reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-primary/40 transition-colors font-mono text-[10px] uppercase tracking-widest"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerar
        </button>
      }
    >
      <HomeSectionGrid
        items={items}
        loading={loading}
        error={error}
        emptyMessage="No se encontraron resultados estacionales para este mes."
        onInfo={handlers.onInfo}
        onSave={handlers.onSave}
        isSaved={handlers.isSaved}
        getStatus={handlers.getStatus}
      />
    </HomeSectionFrame>
  );
}
