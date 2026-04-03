import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Music, Sparkles, History, ExternalLink } from 'lucide-react';
import { Movie } from '../types/movie';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  historicalContext?: string;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  historicalContext
}) => {
  if (!movie) return null;

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
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-surface-container-highest/20 hover:bg-surface-container-highest/40 transition-colors text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Poster Section */}
          <div className="w-full md:w-2/5 aspect-[2/3] md:aspect-auto relative group">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
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
