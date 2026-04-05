import { Sparkles } from 'lucide-react';
import { Movie, ViewingStatus } from '../../../types/movie';
import { CinematicMovieCard } from '../../../components/CinematicMovieCard';

interface HomeSectionGridProps {
  items: Movie[];
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  onInfo: (movie: Movie) => void;
  onSave: (movie: Movie) => Promise<void>;
  isSaved: (movie: Movie) => boolean;
  getStatus: (movie: Movie) => ViewingStatus | undefined;
}

export function HomeSectionGrid({
  items,
  loading,
  error,
  emptyMessage,
  onInfo,
  onSave,
  isSaved,
  getStatus,
}: HomeSectionGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" role="status" aria-label="Cargando titulos">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[2/3] rounded-xl bg-surface-container-highest/20 animate-pulse border border-white/5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="h-52 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center p-6 text-center"
        role="alert"
      >
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="h-52 rounded-2xl border border-white/10 bg-surface-container-highest/10 flex flex-col items-center justify-center text-center gap-3 px-6"
        role="status"
      >
        <Sparkles className="w-8 h-8 text-primary/40" />
        <p className="text-on-surface-variant text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((movie) => (
        <CinematicMovieCard
          key={`${movie.mediaType}-${movie.tmdbId ?? `${movie.title}-${movie.releaseYear}`}`}
          movie={movie}
          onSave={onSave}
          onInfo={onInfo}
          isSaved={isSaved(movie)}
          status={getStatus(movie)}
        />
      ))}
    </div>
  );
}
