import { useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import { CountryResultsPanel } from '../features/countries/components/CountryResultsPanel';
import { WorldCountryMap } from '../features/countries/components/WorldCountryMap';
import { getCountryByMapId } from '../features/countries/config/countryConfig';
import { useCountryDiscovery } from '../features/countries/hooks/useCountryDiscovery';
import { useVault } from '../features/vault/hooks/useVault';
import { Movie } from '../types/movie';
import { MovieDetailModal } from '../components/MovieDetailModal';
import { Toast, ToastType } from '../components/Toast';

export function CountriesPage() {
  const [selectedCountryMapId, setSelectedCountryMapId] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const selectedCountry = useMemo(
    () => (selectedCountryMapId ? getCountryByMapId(selectedCountryMapId) ?? null : null),
    [selectedCountryMapId]
  );

  const { items, loading, error, source, hasLoadedCountry, reload } = useCountryDiscovery(selectedCountry);

  const {
    saveMovie,
    deleteMovieByReference,
    updateStatusByReference,
    updateRatingByReference,
    updateNotesByReference,
    isSaved,
    getRecord,
  } = useVault();

  const selectedRecord = getRecord(selectedMovie);

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
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 glass">
          <Globe className="w-4 h-4 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
            Descubrimiento global
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight">Explora por país</h1>
        <p className="max-w-3xl text-on-surface-variant">
          El mapa te permite descubrir películas y series según su país de origen. Selecciona un país y abre cualquier card para ver su detalle.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
          País seleccionado
        </span>
        <span className="px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-sm">
          {selectedCountry?.label ?? 'Ninguno'}
        </span>
        {selectedCountry && (
          <button
            onClick={() => setSelectedCountryMapId(null)}
            className="px-3 py-2 rounded-full border border-white/15 text-xs hover:border-primary/40 hover:bg-primary/10 transition-colors"
          >
            Limpiar selección
          </button>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,1fr)] gap-6 items-start">
        <WorldCountryMap
          selectedCountryMapId={selectedCountryMapId}
          onSelectCountry={setSelectedCountryMapId}
        />
        <CountryResultsPanel
          selectedCountry={selectedCountry}
          items={items}
          loading={loading}
          error={error}
          source={source}
          hasLoadedCountry={hasLoadedCountry}
          onSelectCountry={setSelectedCountryMapId}
          onClearSelection={() => setSelectedCountryMapId(null)}
          onRetry={() => {
            void reload();
          }}
          onInfo={setSelectedMovie}
          onSave={handleSaveToArchive}
          isSaved={isSaved}
          getStatus={(movie) => getRecord(movie)?.status}
        />
      </section>

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
          showToast('Notas actualizadas.', 'info');
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
