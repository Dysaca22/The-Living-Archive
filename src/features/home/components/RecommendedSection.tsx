import { RefreshCw } from 'lucide-react';
import { VaultMovieRecord } from '../../../types/movie';
import { useRecommendedSection } from '../hooks/useRecommendedSection';
import { HomeSectionFrame } from './HomeSectionFrame';
import { HomeSectionGrid } from './HomeSectionGrid';
import { HomeSectionCardHandlers } from './sectionTypes';

interface RecommendedSectionProps extends HomeSectionCardHandlers {
  records: VaultMovieRecord[];
}

export function RecommendedSection({ records, ...handlers }: RecommendedSectionProps) {
  const { items, loading, error, reload } = useRecommendedSection(records);

  return (
    <HomeSectionFrame
      title="Recomendado para ti"
      subtitle="Personalizado con tu boveda local: afinidad de generos y titulos guardados."
      actions={
        <button
          onClick={() => void reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-primary/40 transition-colors font-mono text-[10px] uppercase tracking-widest"
        >
          <RefreshCw className="w-3 h-3" />
          Recalcular
        </button>
      }
    >
      <HomeSectionGrid
        items={items}
        loading={loading}
        error={error}
        emptyMessage="Guarda algunos titulos en tu boveda para habilitar recomendaciones personalizadas."
        onInfo={handlers.onInfo}
        onSave={handlers.onSave}
        isSaved={handlers.isSaved}
        getStatus={handlers.getStatus}
      />
    </HomeSectionFrame>
  );
}
