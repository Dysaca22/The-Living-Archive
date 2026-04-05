import { ChangeEvent, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Archive, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CinematicMovieCard } from '../components/CinematicMovieCard';
import { MovieDetailModal } from '../components/MovieDetailModal';
import { Toast, ToastType } from '../components/Toast';
import { VaultFilters } from '../components/VaultFilters';
import { Movie, ViewingStatus } from '../types/movie';
import { useVault } from '../features/vault/hooks/useVault';

export function VaultPage() {
  const {
    records,
    deleteMovie,
    deleteMovieByReference,
    updateStatusByReference,
    updateRatingByReference,
    updateNotesByReference,
    clearVault,
    exportVault,
    importVault,
    isSaved,
    getRecord,
  } = useVault();

  const [archiveSearch, setArchiveSearch] = useState('');
  const [vaultFilter, setVaultFilter] = useState<ViewingStatus | 'all'>('all');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const filteredArchive = useMemo(() => {
    return records
      .filter((movie) => {
        const matchesSearch =
          movie.title.toLowerCase().includes(archiveSearch.toLowerCase()) ||
          (movie.userNotes && movie.userNotes.toLowerCase().includes(archiveSearch.toLowerCase()));
        const matchesFilter = vaultFilter === 'all' || movie.status === vaultFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  }, [records, archiveSearch, vaultFilter]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleExportVault = () => {
    try {
      const data = exportVault();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `the-living-archive-vault-${new Date().toISOString().split('T')[0]}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showToast('Bóveda exportada correctamente.', 'success');
    } catch {
      showToast('No se pudo exportar la bóveda.', 'error');
    }
  };

  const handleImportVault = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const content = loadEvent.target?.result as string;
        const { imported, skipped } = importVault(content);
        showToast(`Importación completada: ${imported} agregados, ${skipped} omitidos.`, 'success');
      } catch (importError) {
        const message = importError instanceof Error ? importError.message : 'No se pudo importar la bóveda.';
        showToast(message, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDelete = (movie: Movie) => {
    deleteMovie(movie.title, movie.releaseYear, movie.mediaType, movie.tmdbId);
    showToast('Título eliminado de la bóveda.', 'info');
  };

  const selectedRecord = getRecord(selectedMovie);

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-16 flex flex-col md:flex-row items-end justify-between gap-8">
        <div className="text-left">
          <h1 className="text-6xl font-serif mb-4 italic">La Bóveda</h1>
          <p className="font-mono text-on-surface-variant uppercase tracking-[0.3em] text-[10px]">
            {records.length} títulos guardados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
          <VaultFilters currentFilter={vaultFilter} onFilterChange={setVaultFilter} />
          <div className="glass rounded-full px-6 py-3 flex items-center gap-3 flex-1 md:w-64 focus-within:ring-2 focus-within:ring-primary focus-within:outline-none">
            <Search className="w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Filtrar en la bóveda..."
              value={archiveSearch}
              onChange={(event) => setArchiveSearch(event.target.value)}
              aria-label="Filtrar títulos de la bóveda"
              className="bg-transparent border-none outline-none text-xs w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExportVault}
              className="text-on-surface-variant hover:text-primary transition-colors font-mono text-xs uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-2 py-1"
              aria-label="Exportar bóveda en JSON"
            >
              Exportar
            </button>
            <label
              className="text-on-surface-variant hover:text-primary transition-colors font-mono text-xs uppercase tracking-widest cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:outline-none rounded px-2 py-1"
              aria-label="Importar bóveda desde JSON"
            >
              Importar
              <input type="file" accept=".json" onChange={handleImportVault} className="hidden" />
            </label>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-on-surface-variant hover:text-red-400 transition-colors font-mono text-xs uppercase tracking-widest whitespace-nowrap focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded px-2 py-1"
              aria-label="Limpiar toda la bóveda"
            >
              Limpiar bóveda
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredArchive.length > 0 ? (
            filteredArchive.map((movie, index) => (
              <motion.div
                key={`${movie.mediaType}-${movie.tmdbId ?? `${movie.title}-${movie.releaseYear}`}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <CinematicMovieCard
                  movie={movie}
                  onDelete={handleDelete}
                  onInfo={setSelectedMovie}
                  isSaved
                  status={movie.status}
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-96 glass rounded-3xl border-dashed border-white/10">
              <Archive className="w-12 h-12 text-primary/20 mb-6" />
              <h3 className="text-xl font-serif italic mb-2">
                {archiveSearch ? 'No hay coincidencias con ese filtro' : 'La bóveda está vacía'}
              </h3>
              <p className="text-on-surface-variant text-sm font-mono uppercase tracking-widest text-center px-4">
                {archiveSearch ? 'Prueba otro término' : 'Descubre títulos y guárdalos aquí.'}
              </p>
              {!archiveSearch && (
                <Link
                  to="/buscar"
                  className="mt-8 text-primary hover:underline font-mono text-xs uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-2 py-1"
                >
                  Ir al buscador
                </Link>
              )}
            </div>
          )}
        </AnimatePresence>
      </section>

      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onDelete={(selected) => {
          deleteMovieByReference(selected);
          showToast('Título eliminado de la bóveda.', 'info');
        }}
        onUpdateStatus={(selected, status) => {
          updateStatusByReference(selected, status);
          showToast('Estado actualizado.', 'info');
        }}
        onUpdateRating={(selected, userRating) => {
          updateRatingByReference(selected, userRating);
          showToast(`Calificación personal: ${userRating}/5.`, 'info');
        }}
        onUpdateNotes={(selected, userNotes) => {
          updateNotesByReference(selected, userNotes);
          showToast('Notas guardadas.', 'info');
        }}
        onNavigateToMovie={setSelectedMovie}
        isSaved={selectedMovie ? isSaved(selectedMovie) : false}
        currentStatus={selectedRecord?.status}
        currentRating={selectedRecord?.userRating}
        currentNotes={selectedRecord?.userNotes}
      />

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass p-8 rounded-3xl max-w-md w-full border border-red-500/20 shadow-2xl shadow-red-500/10"
            >
              <div className="flex items-center gap-4 mb-6 text-red-400">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-2xl font-serif italic">¿Limpiar bóveda?</h3>
              </div>
              <p className="text-on-surface-variant mb-8 leading-relaxed">
                Esta acción elimina todos tus títulos guardados y no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-mono text-xs uppercase tracking-widest text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    clearVault();
                    setShowClearConfirm(false);
                    showToast('Bóveda limpiada correctamente.', 'success');
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors font-mono text-xs uppercase tracking-widest text-red-400 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <Toast message={toast.message} type={toast.type} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
