import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Film,
  MessageSquare,
  Save,
  Sparkles,
  Star,
  Trash2,
  Tv,
  Users,
  X,
  Archive as ArchiveIcon,
} from 'lucide-react';
import { useMediaDetail } from '../features/detail/hooks/useMediaDetail';
import { useThemeController } from '../features/theme/ThemeContext';
import { Movie, ViewingStatus } from '../types/movie';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onSave?: (movie: Movie) => Promise<void>;
  onDelete?: (movie: Movie) => void;
  onUpdateStatus?: (movie: Movie, status: ViewingStatus) => void;
  onUpdateRating?: (movie: Movie, rating: number) => void;
  onUpdateNotes?: (movie: Movie, notes: string) => void;
  onNavigateToMovie?: (movie: Movie) => void;
  isSaved?: boolean;
  currentStatus?: ViewingStatus;
  currentRating?: number;
  currentNotes?: string;
  historicalContext?: string;
}

function formatVoteCount(voteCount: number | undefined): string {
  if (typeof voteCount !== 'number') {
    return 'Sin dato';
  }
  return new Intl.NumberFormat('es-CO').format(voteCount);
}

function formatDate(rawDate: string | undefined): string {
  if (!rawDate) {
    return 'Sin fecha';
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function truncateContent(content: string, maxLength = 380): string {
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.slice(0, maxLength).trim()}...`;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  onSave,
  onDelete,
  onUpdateStatus,
  onUpdateRating,
  onUpdateNotes,
  onNavigateToMovie,
  isSaved,
  currentStatus,
  currentRating,
  currentNotes,
  historicalContext,
}) => {
  const { detail, loading, error } = useMediaDetail(movie);
  const { applyThemeFromMedia, resetTheme } = useThemeController();

  const [localNotes, setLocalNotes] = useState(currentNotes || '');
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setLocalNotes(currentNotes || '');
  }, [currentNotes]);

  useEffect(() => {
    if (!movie) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [movie, onClose]);

  useEffect(() => {
    if (!movie) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [movie]);

  useEffect(() => {
    if (!movie) {
      return;
    }
    void applyThemeFromMedia(movie, detail);
  }, [applyThemeFromMedia, detail, movie]);

  useEffect(() => {
    if (!movie) {
      resetTheme();
      return;
    }

    return () => {
      resetTheme();
    };
  }, [movie, resetTheme]);

  const activeMovie = useMemo<Movie | null>(() => {
    if (!movie) {
      return null;
    }

    return {
      ...movie,
      mediaType: detail?.mediaType || movie.mediaType,
      title: detail?.title || movie.title,
      narrativeJustification: detail?.overview || movie.narrativeJustification,
      posterUrl: detail?.posterUrl || movie.posterUrl,
      backdropUrl: detail?.backdropUrl || movie.backdropUrl,
    };
  }, [detail, movie]);

  if (!activeMovie) {
    return null;
  }

  const statusOptions: Array<{ value: ViewingStatus; label: string; icon: typeof Clock }> = [
    { value: 'no_visto', label: 'No visto', icon: Clock },
    { value: 'en_proceso', label: 'En proceso', icon: ArchiveIcon },
    { value: 'visto', label: 'Visto', icon: CheckCircle2 },
  ];

  const publicRating = detail?.publicMetrics.voteAverage;
  const publicVotes = detail?.publicMetrics.voteCount;
  const seasons = detail?.seasons || [];
  const hasCollection = Boolean(detail?.collection && detail.collection.items.length > 0);
  const tmdbLink = activeMovie.tmdbId
    ? `https://www.themoviedb.org/${activeMovie.mediaType}/${activeMovie.tmdbId}`
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-surface-dim/85 backdrop-blur-xl p-3 sm:p-6 md:p-8 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 24 }}
          className="relative w-full max-w-6xl mx-auto glass rounded-3xl border border-white/10 overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-surface-container-highest/60 hover:bg-surface-container-highest/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative h-56 sm:h-72 border-b border-white/10">
            {activeMovie.backdropUrl && !hasImageError ? (
              <img
                src={activeMovie.backdropUrl}
                alt={activeMovie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setHasImageError(true)}
              />
            ) : activeMovie.posterUrl && !hasImageError ? (
              <img
                src={activeMovie.posterUrl}
                alt={activeMovie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-container-highest/20">
                <Sparkles className="w-12 h-12 text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/20 to-transparent" />
            <div className="absolute left-6 right-6 bottom-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-mono text-[10px] uppercase tracking-widest">
                  {activeMovie.mediaType === 'tv' ? 'Serie' : 'Pelicula'}
                </span>
                {tmdbLink && (
                  <a
                    href={tmdbLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
                  >
                    TMDB
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif italic leading-tight">{activeMovie.title}</h2>
              <p className="mt-2 text-xs sm:text-sm text-on-surface-variant flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {activeMovie.releaseYear}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-0">
            <div className="p-6 md:p-8 space-y-8">
              <section className="space-y-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Resumen</h3>
                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                  {detail?.overview || activeMovie.narrativeJustification}
                </p>
                {detail?.genres && detail.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {detail.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-2.5 py-1 rounded-full border border-white/15 text-[10px] uppercase tracking-widest text-on-surface-variant"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
                  Recepcion publica
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                      Rating del publico
                    </p>
                    <p className="text-2xl font-serif italic">
                      {typeof publicRating === 'number' ? publicRating.toFixed(1) : 'Sin dato'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                      Cantidad de votos
                    </p>
                    <p className="text-2xl font-serif italic">{formatVoteCount(publicVotes)}</p>
                  </div>
                </div>

                {loading && (
                  <div className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4 animate-pulse h-24" />
                )}

                {!loading && error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>
                )}

                {!loading && !error && (
                  <div className="space-y-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Comentarios publicos
                    </p>
                    {detail?.publicReviews && detail.publicReviews.length > 0 ? (
                      <div className="space-y-3">
                        {detail.publicReviews.map((review) => (
                          <article
                            key={review.id}
                            className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4 space-y-2"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                              <Users className="w-3.5 h-3.5 text-primary" />
                              <span>{review.author}</span>
                              <span>-</span>
                              <span>{formatDate(review.createdAt)}</span>
                              {typeof review.authorRating === 'number' && (
                                <>
                                  <span>-</span>
                                  <span>{review.authorRating}/10</span>
                                </>
                              )}
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                              {truncateContent(review.content)}
                            </p>
                            {review.url && (
                              <a
                                href={review.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                Ver review completa
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4 text-sm text-on-surface-variant">
                        No hay reviews publicas disponibles para este titulo en este momento.
                      </div>
                    )}
                  </div>
                )}
              </section>

              {activeMovie.mediaType === 'tv' && (
                <section className="space-y-4">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Temporadas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                        Total temporadas
                      </p>
                      <p className="text-2xl font-serif italic">
                        {typeof detail?.numberOfSeasons === 'number' ? detail.numberOfSeasons : 'Sin dato'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                        Total episodios
                      </p>
                      <p className="text-2xl font-serif italic">
                        {typeof detail?.numberOfEpisodes === 'number' ? detail.numberOfEpisodes : 'Sin dato'}
                      </p>
                    </div>
                  </div>

                  {seasons.length > 0 ? (
                    <div className="space-y-2">
                      {seasons.map((season) => (
                        <div
                          key={season.id}
                          className="rounded-xl border border-white/10 bg-surface-container-highest/10 px-4 py-3 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm">{season.name}</p>
                            <p className="text-xs text-on-surface-variant">
                              Temporada {season.seasonNumber} - {season.episodeCount} episodios
                            </p>
                          </div>
                          <p className="text-xs text-on-surface-variant">{formatDate(season.airDate)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4 text-sm text-on-surface-variant">
                      No hay desglose de temporadas disponible.
                    </div>
                  )}
                </section>
              )}

              {hasCollection && detail?.collection && (
                <section className="space-y-4">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
                    Saga / Coleccion
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    {detail.collection.name}. Tambien te puede interesar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detail.collection.items.map((relatedMovie) => (
                      <button
                        key={relatedMovie.tmdbId ?? `${relatedMovie.title}-${relatedMovie.releaseYear}`}
                        onClick={() => {
                          if (onNavigateToMovie) {
                            onNavigateToMovie(relatedMovie);
                          }
                        }}
                        className="text-left rounded-2xl border border-white/10 bg-surface-container-highest/10 p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        disabled={!onNavigateToMovie}
                      >
                        <div className="flex items-start gap-3">
                          {relatedMovie.posterUrl ? (
                            <img
                              src={relatedMovie.posterUrl}
                              alt={relatedMovie.title}
                              className="w-14 h-20 object-cover rounded-lg shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-14 h-20 rounded-lg bg-surface-container-highest/20 flex items-center justify-center shrink-0">
                              <Film className="w-5 h-5 text-on-surface-variant/50" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm leading-snug">{relatedMovie.title}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{relatedMovie.releaseYear}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {historicalContext && (
                <section className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                    Efemeride asociada
                  </p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{historicalContext}</p>
                </section>
              )}
            </div>

            <aside className="p-6 md:p-8 border-t xl:border-t-0 xl:border-l border-white/10 bg-surface-container-highest/5 space-y-6">
              <section className="space-y-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Tu registro</h3>
                {isSaved ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-mono uppercase tracking-widest">
                    Guardado en boveda
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest/20 text-on-surface-variant text-xs font-mono uppercase tracking-widest">
                    Aun no guardado
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Calificacion personal
                </p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      onClick={() => onUpdateRating?.(activeMovie, starValue)}
                      className="p-1 rounded-full transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          (currentRating || 0) >= starValue
                            ? 'fill-primary text-primary'
                            : 'text-on-surface-variant/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Estado de visualizacion
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {statusOptions.map((statusOption) => (
                    <button
                      key={statusOption.value}
                      onClick={() => onUpdateStatus?.(activeMovie, statusOption.value)}
                      className={`w-full rounded-xl px-4 py-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest transition-colors border ${
                        currentStatus === statusOption.value
                          ? 'border-primary/40 bg-primary/15 text-primary'
                          : 'border-white/10 text-on-surface-variant hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <span>{statusOption.label}</span>
                      <statusOption.icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <MessageSquare className="w-4 h-4" />
                  <p className="font-mono text-[10px] uppercase tracking-widest">Notas personales</p>
                </div>
                <textarea
                  value={localNotes}
                  onChange={(event) => setLocalNotes(event.target.value)}
                  onBlur={() => onUpdateNotes?.(activeMovie, localNotes)}
                  placeholder="Que te dejo este titulo?"
                  className="w-full min-h-[120px] resize-none rounded-xl border border-white/10 bg-surface-container-highest/20 p-3 text-sm focus:outline-none focus:border-primary/30"
                />
              </section>

              <section className="space-y-3">
                {!isSaved ? (
                  <button
                    onClick={() => void onSave?.(activeMovie)}
                    className="w-full rounded-xl px-4 py-3 inline-flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-mono text-xs uppercase tracking-widest transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Save className="w-4 h-4" />
                    Guardar en boveda
                  </button>
                ) : (
                  <button
                    onClick={() => onDelete?.(activeMovie)}
                    className="w-full rounded-xl px-4 py-3 inline-flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 border border-red-500/20 text-red-300 font-mono text-xs uppercase tracking-widest transition-colors focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar de boveda
                  </button>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-surface-container-highest/10 p-4 space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Tipo de medio
                </p>
                <p className="text-sm flex items-center gap-2">
                  {activeMovie.mediaType === 'tv' ? (
                    <>
                      <Tv className="w-4 h-4 text-primary" />
                      Serie
                    </>
                  ) : (
                    <>
                      <Film className="w-4 h-4 text-primary" />
                      Pelicula
                    </>
                  )}
                </p>
              </section>
            </aside>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
