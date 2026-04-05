import { useMemo, useState } from 'react';
import { Navigate, NavLink, useParams } from 'react-router-dom';
import { Compass, RefreshCw } from 'lucide-react';
import { HomeSectionFrame } from '../features/home/components/HomeSectionFrame';
import { HomeSectionGrid } from '../features/home/components/HomeSectionGrid';
import { CATEGORY_DEFINITIONS, getCategoryBySlug } from '../features/categories/config/categoryConfig';
import { useCategoryDiscovery } from '../features/categories/hooks/useCategoryDiscovery';
import { useVault } from '../features/vault/hooks/useVault';
import { Movie } from '../types/movie';
import { MovieDetailModal } from '../components/MovieDetailModal';
import { Toast, ToastType } from '../components/Toast';

function getCategoryStyle(accentRgb: string, heroFrom: string, heroTo: string, ambientA: string, ambientB: string) {
  return {
    hero: {
      backgroundImage: `linear-gradient(135deg, ${heroFrom} 0%, ${heroTo} 100%)`,
      border: `1px solid rgba(${accentRgb}, 0.35)`,
      boxShadow: `0 26px 60px -28px rgba(${accentRgb}, 0.55)`,
    },
    ambientA: {
      background: `radial-gradient(circle, ${ambientA} 0%, transparent 70%)`,
    },
    ambientB: {
      background: `radial-gradient(circle, ${ambientB} 0%, transparent 70%)`,
    },
    accent: {
      color: `rgb(${accentRgb})`,
    },
    accentSoft: {
      backgroundColor: `rgba(${accentRgb}, 0.14)`,
      borderColor: `rgba(${accentRgb}, 0.32)`,
      color: `rgb(${accentRgb})`,
    },
    surfaceBorder: {
      borderColor: `rgba(${accentRgb}, 0.2)`,
    },
  };
}

export function CategoryPage() {
  const { slug } = useParams();
  const category = getCategoryBySlug(slug);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const {
    saveMovie,
    deleteMovieByReference,
    updateStatusByReference,
    updateRatingByReference,
    updateNotesByReference,
    isSaved,
    getRecord,
  } = useVault();

  const { items, loading, error, strategyLabel, reload } = useCategoryDiscovery(category);

  const selectedRecord = getRecord(selectedMovie);

  const visualStyle = useMemo(() => {
    if (!category) {
      return null;
    }
    return getCategoryStyle(
      category.palette.accentRgb,
      category.palette.heroFrom,
      category.palette.heroTo,
      category.palette.ambientA,
      category.palette.ambientB
    );
  }, [category]);

  if (!category || !visualStyle) {
    return <Navigate to="/categoria/terror" replace />;
  }

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleSaveToArchive = async (movie: Movie) => {
    try {
      await saveMovie(movie);
      showToast('Título guardado en tu bóveda.', 'success');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'No se pudo guardar el título.';
      showToast(message, 'error');
      throw saveError;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      <div className="pointer-events-none absolute -top-24 -left-10 w-80 h-80 opacity-70 blur-2xl" style={visualStyle.ambientA} />
      <div className="pointer-events-none absolute top-20 right-0 w-72 h-72 opacity-60 blur-2xl" style={visualStyle.ambientB} />

      <section className="glass rounded-3xl p-6 md:p-8 relative overflow-hidden" style={visualStyle.hero}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono border rounded-full px-3 py-1" style={visualStyle.accentSoft}>
              <Compass className="w-3.5 h-3.5" />
              Ruta inmersiva
            </span>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight">{category.heroTitle}</h1>
            <p className="text-on-surface-variant text-sm md:text-base max-w-2xl">{category.heroSubtitle}</p>
          </div>
          <button
            onClick={() => void reload()}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors hover:bg-white/5"
            style={visualStyle.accentSoft}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar
          </button>
        </div>
      </section>

      <section className="glass rounded-3xl p-4 md:p-5 border border-white/10">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_DEFINITIONS.map((item) => (
            <NavLink
              key={item.slug}
              to={`/categoria/${item.slug}`}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-xs font-mono uppercase tracking-widest border transition-colors ${
                  isActive
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'border-white/10 text-on-surface-variant hover:border-white/30 hover:text-on-surface'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </section>

      <HomeSectionFrame
        title={category.label}
        subtitle={category.description}
        actions={
          <div className="max-w-xl text-right">
            <p className="text-[10px] uppercase tracking-widest font-mono text-on-surface-variant mb-1">
              Estrategia de descubrimiento
            </p>
            <p className="text-xs" style={visualStyle.accent}>
              {strategyLabel}
            </p>
          </div>
        }
      >
        <div className="rounded-2xl border p-4 mb-6 bg-surface-container-highest/10" style={visualStyle.surfaceBorder}>
          <p className="text-sm text-on-surface-variant">
            Explorando <span style={visualStyle.accent}>{category.label}</span> con una configuración temática dedicada.
            Puedes abrir cualquier card para revisar el detalle completo y registrar tu avance en la bóveda.
          </p>
        </div>

        <HomeSectionGrid
          items={items}
          loading={loading}
          error={error}
          emptyMessage={`No encontramos títulos para ${category.label}. Intenta regenerar esta categoría.`}
          onInfo={setSelectedMovie}
          onSave={handleSaveToArchive}
          isSaved={isSaved}
          getStatus={(movie) => getRecord(movie)?.status}
        />
      </HomeSectionFrame>

      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onSave={handleSaveToArchive}
        onDelete={(selected) => {
          deleteMovieByReference(selected);
          showToast('Título eliminado de la bóveda.', 'info');
        }}
        onUpdateStatus={(selected, status) => {
          updateStatusByReference(selected, status);
          showToast('Estado actualizado.', 'info');
        }}
        onUpdateRating={(selected, rating) => {
          updateRatingByReference(selected, rating);
          showToast(`Calificación personal: ${rating}/5.`, 'info');
        }}
        onUpdateNotes={(selected, notes) => {
          updateNotesByReference(selected, notes);
          showToast('Notas guardadas.', 'info');
        }}
        onNavigateToMovie={setSelectedMovie}
        isSaved={selectedMovie ? isSaved(selectedMovie) : false}
        currentStatus={selectedRecord?.status}
        currentRating={selectedRecord?.userRating}
        currentNotes={selectedRecord?.userNotes}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
