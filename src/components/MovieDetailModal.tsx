import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Music, Sparkles, History, ExternalLink, Save, Trash2, CheckCircle2, Clock, Archive as ArchiveIcon, Star, MessageSquare } from 'lucide-react';
import { Movie, ViewingStatus } from '../types/movie';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onSave?: (movie: Movie) => Promise<void>;
  onDelete?: (title: string, releaseYear: number) => void;
  onUpdateStatus?: (title: string, releaseYear: number, status: ViewingStatus) => void;
  onUpdateRating?: (title: string, releaseYear: number, rating: number) => void;
  onUpdateNotes?: (title: string, releaseYear: number, notes: string) => void;
  isSaved?: boolean;
  currentStatus?: ViewingStatus;
  currentRating?: number;
  currentNotes?: string;
  historicalContext?: string;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  onSave,
  onDelete,
  onUpdateStatus,
  onUpdateRating,
  onUpdateNotes,
  isSaved,
  currentStatus,
  currentRating,
  currentNotes,
  historicalContext
}) => {
  if (!movie) return null;

  const [localNotes, setLocalNotes] = React.useState(currentNotes || '');
  const [hasImageError, setHasImageError] = React.useState(false);

  React.useEffect(() => {
    setLocalNotes(currentNotes || '');
  }, [currentNotes]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-surface-dim/80 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] glass rounded-3xl overflow-hidden flex flex-col md:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dynamic Background Effect (Ambilight) */}
          {movie.posterUrl && !hasImageError && (
            <img 
              src={movie.posterUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[100px] mix-blend-screen z-[-1]" 
              referrerPolicy="no-referrer"
              aria-hidden="true"
              onError={() => setHasImageError(true)}
            />
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-surface-container-highest/40 hover:bg-surface-container-highest/60 transition-colors text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Poster Section */}
          <div className="w-full md:w-2/5 aspect-[2/3] md:aspect-auto relative group">
            {movie.posterUrl && !hasImageError ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-container-highest/10">
                <Sparkles className="text-primary/20 w-16 h-16" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-surface-dim/20" />
          </div>

          {/* Content Section */}
          <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-mono text-[10px] uppercase tracking-widest">
                    Astral Record
                  </span>
                  {movie.tmdbId && (
                    <a 
                      href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <h2 className="text-4xl md:text-5xl font-serif italic leading-tight mb-4">
                  {movie.title}
                </h2>
                <div className="flex items-center gap-6 font-mono text-xs text-on-surface-variant uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {movie.releaseYear}
                  </div>
                  {movie.soundtrackHighlight && (
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-primary" />
                      {movie.soundtrackHighlight}
                    </div>
                  )}
                </div>
              </div>

              {/* Narrative Justification */}
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                  The Curator's Resonance
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-lg italic">
                  "{movie.narrativeJustification}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-6">
                {isSaved ? (
                  <>
                    {/* Rating & Notes */}
                    <div className="space-y-6 p-6 bg-surface-container-highest/10 rounded-3xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Personal Rating</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => onUpdateRating?.(movie.title, movie.releaseYear, star)}
                              className="transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-full p-1"
                            >
                              <Star 
                                className={`w-5 h-5 ${
                                  (currentRating || 0) >= star 
                                    ? 'fill-primary text-primary' 
                                    : 'text-on-surface-variant/30'
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <MessageSquare className="w-3 h-3" />
                          <span className="font-mono text-[10px] uppercase tracking-widest">Personal Notes</span>
                        </div>
                        <textarea
                          value={localNotes}
                          onChange={(e) => setLocalNotes(e.target.value)}
                          onBlur={() => onUpdateNotes?.(movie.title, movie.releaseYear, localNotes)}
                          placeholder="What did this resonance evoke in you?..."
                          className="w-full bg-surface-container-highest/20 rounded-xl p-4 text-sm font-serif italic border border-white/5 focus:outline-none focus:border-primary/30 transition-colors min-h-[100px] resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-surface-container-highest/20 rounded-2xl border border-white/5">
                      {(['pending', 'watched', 'archived'] as ViewingStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => onUpdateStatus?.(movie.title, movie.releaseYear, status)}
                          className={`flex-1 py-3 rounded-xl font-mono text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                            currentStatus === status 
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                              : 'text-on-surface-variant hover:bg-white/5'
                          }`}
                        >
                          {status === 'pending' && <Clock className="w-3 h-3" />}
                          {status === 'watched' && <CheckCircle2 className="w-3 h-3" />}
                          {status === 'archived' && <ArchiveIcon className="w-3 h-3" />}
                          {status}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => onDelete?.(movie.title, movie.releaseYear)}
                      className="w-full py-4 rounded-2xl bg-transparent hover:bg-red-500/10 text-red-400 font-mono text-xs uppercase tracking-[0.2em] transition-all border border-transparent focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sever Link
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onSave?.(movie)}
                    className="w-full py-4 rounded-2xl bg-primary/20 hover:bg-primary/30 text-primary font-mono text-xs uppercase tracking-[0.2em] transition-all border border-primary/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,77,0,0.15)]"
                  >
                    <Save className="w-4 h-4" />
                    Persist Resonance
                  </button>
                )}
              </div>

              {/* Historical Context */}
              {historicalContext && (
                <div className="p-6 rounded-2xl bg-surface-container-highest/10 border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-primary" />
                    <h4 className="font-mono text-[10px] uppercase tracking-widest">Historical Resonance</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed italic">
                    {historicalContext}
                  </p>
                </div>
              )}

              {/* Astral Aura Decoration */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -z-10" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
