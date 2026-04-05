import { useState } from 'react';
import { Movie } from '../types/movie';
import { useVault } from '../features/vault/hooks/useVault';
import { TrendingSection } from '../features/home/components/TrendingSection';
import { SeasonalSection } from '../features/home/components/SeasonalSection';
import { HistorySection } from '../features/home/components/HistorySection';
import { RecommendedSection } from '../features/home/components/RecommendedSection';
import { MovieDetailModal } from '../components/MovieDetailModal';
import { Toast, ToastType } from '../components/Toast';

export function HomePage() {
  const {
    records,
    saveMovie,
    deleteMovieByReference,
    updateStatusByReference,
    updateRatingByReference,
    updateNotesByReference,
    isSaved,
    getRecord,
  } = useVault();

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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

  const selectedRecord = getRecord(selectedMovie);

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="text-center">
        <h1 className="text-6xl md:text-8xl font-serif mb-6 italic tracking-tighter">Inicio</h1>
        <p className="text-on-surface-variant max-w-3xl mx-auto">
          Descubre qué ver hoy con señales en tiempo real, temporada actual, efemérides del día y recomendaciones personalizadas a partir de tu bóveda local.
        </p>
      </header>

      <TrendingSection
        onInfo={setSelectedMovie}
        onSave={handleSaveToArchive}
        isSaved={isSaved}
        getStatus={(movie) => getRecord(movie)?.status}
      />

      <SeasonalSection
        onInfo={setSelectedMovie}
        onSave={handleSaveToArchive}
        isSaved={isSaved}
        getStatus={(movie) => getRecord(movie)?.status}
      />

      <HistorySection
        onInfo={setSelectedMovie}
        onSave={handleSaveToArchive}
        isSaved={isSaved}
        getStatus={(movie) => getRecord(movie)?.status}
      />

      <RecommendedSection
        records={records}
        onInfo={setSelectedMovie}
        onSave={handleSaveToArchive}
        isSaved={isSaved}
        getStatus={(movie) => getRecord(movie)?.status}
      />

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
