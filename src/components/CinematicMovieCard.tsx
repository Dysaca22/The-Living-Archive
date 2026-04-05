import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { extractColors } from 'extract-colors';
import { Archive as ArchiveIcon, Check, CheckCircle2, Clock, Info, Save, Sparkles, Trash2 } from 'lucide-react';

import { Movie, ViewingStatus } from '../types/movie';

interface CinematicMovieCardProps {
  movie: Movie;
  onSave?: (movie: Movie) => Promise<void>;
  onDelete?: (movie: Movie) => void;
  onInfo?: (movie: Movie) => void;
  isSaved?: boolean;
  status?: ViewingStatus;
}

/**
 * Card cinematográfica con color dominante de portada.
 */
export const CinematicMovieCard: React.FC<CinematicMovieCardProps> = ({
  movie,
  onSave,
  onDelete,
  onInfo,
  isSaved: isSavedProp = false,
  status,
}) => {
  const statusLabel: Record<ViewingStatus, string> = {
    no_visto: 'No visto',
    en_proceso: 'En proceso',
    visto: 'Visto',
  };

  const [dominantColor, setDominantColor] = useState<string>('rgba(255, 77, 0, 0.15)');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(isSavedProp);
  const [hasImageError, setHasImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsSaved(isSavedProp);
  }, [isSavedProp]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSave || isSaved || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(movie);
      setIsSaved(true);
    } catch (error) {
      console.error('No se pudo guardar el título:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInfo) onInfo(movie);
  };

  const handleKeyboardOpen = () => {
    if (onInfo) {
      onInfo(movie);
    }
  };

  useEffect(() => {
    const extractColorFromImage = async () => {
      if (imgRef.current && imgRef.current.complete && movie.posterUrl) {
        try {
          const colors = await extractColors(movie.posterUrl, {
            crossOrigin: 'anonymous',
            pixels: 5000,
            distance: 0.25,
          });

          if (colors.length > 0) {
            const primary = colors[0];
            setDominantColor(`rgba(${primary.red}, ${primary.green}, ${primary.blue}, 0.2)`);
          }
        } catch (error) {
          console.error('No se pudo extraer color de la portada:', error);
        }
      }
    };

    if (imgRef.current) {
      imgRef.current.addEventListener('load', extractColorFromImage);
    }

    return () => {
      if (imgRef.current) {
        imgRef.current.removeEventListener('load', extractColorFromImage);
      }
    };
  }, [movie.posterUrl]);

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="group relative aspect-[2/3] rounded-xl overflow-hidden glass transition-all duration-700 cursor-pointer hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      onClick={handleInfo}
      tabIndex={0}
      role="button"
      aria-label={`Abrir detalle de ${movie.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleKeyboardOpen();
        }
      }}
      style={{
        boxShadow: `0 20px 40px -15px ${dominantColor.replace('0.2', '0.1')}`,
      }}
    >
      {isSaved && status && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full glass border border-white/10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-primary">
          {status === 'no_visto' && <Clock className="w-3 h-3" />}
          {status === 'en_proceso' && <ArchiveIcon className="w-3 h-3" />}
          {status === 'visto' && <CheckCircle2 className="w-3 h-3" />}
          {statusLabel[status]}
        </div>
      )}

      <div
        className="absolute inset-0 -z-10 blur-[100px] transition-colors duration-1000"
        style={{ backgroundColor: dominantColor }}
      />

      <AnimatePresence mode="wait">
        {!isLoaded && !hasImageError && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-surface-container-highest/20 animate-pulse flex items-center justify-center"
          >
            <Sparkles className="text-on-surface-variant/20 w-8 h-8" />
          </motion.div>
        )}
      </AnimatePresence>

      {movie.posterUrl && !hasImageError ? (
        <div className="w-full h-full overflow-hidden">
          <img
            ref={imgRef}
            src={movie.posterUrl}
            alt={movie.title}
            crossOrigin="anonymous"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasImageError(true);
              setIsLoaded(true);
            }}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
              isLoaded
                ? 'opacity-60 group-hover:opacity-100 grayscale-[0.3] group-hover:grayscale-0 scale-100 group-hover:scale-105'
                : 'opacity-0'
            }`}
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-container-highest/10">
          <Sparkles className="text-primary/20 w-12 h-12" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <div className="flex flex-col gap-1">
          {movie.soundtrackHighlight && (
            <span className="font-mono text-[10px] text-primary uppercase tracking-widest mb-1 block opacity-80 group-hover:opacity-100 transition-opacity">
              {movie.soundtrackHighlight}
            </span>
          )}
          <h4 className="text-2xl font-serif leading-tight group-hover:text-primary transition-colors duration-500">
            {movie.title}
          </h4>
          <div className="flex items-center gap-3 mt-2">
            {movie.releaseYear && <span className="font-mono text-[10px] text-on-surface-variant">{movie.releaseYear}</span>}
            <div className="flex items-center gap-4 ml-auto">
              {onDelete ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(movie);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-on-surface-variant hover:text-red-400 p-1 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-red-400 focus-visible:outline-none rounded"
                  aria-label={`Quitar ${movie.title} de la bóveda`}
                  title={`Quitar ${movie.title} de la bóveda`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={isSaving || isSaved}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase font-mono tracking-widest focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none ${
                    isSaved ? 'text-green-400' : 'text-on-surface-variant hover:text-primary'
                  }`}
                  aria-label={isSaved ? `${movie.title} ya está guardada` : `Guardar ${movie.title}`}
                  title={isSaved ? `${movie.title} ya está guardada` : `Guardar ${movie.title}`}
                >
                  {isSaving ? (
                    <span className="animate-pulse">Guardando...</span>
                  ) : isSaved ? (
                    <>
                      <Check className="w-3 h-3" />
                      Guardado
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      Guardar
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleInfo}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-1 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none rounded"
                aria-label={`Ver detalle de ${movie.title}`}
                title={`Ver detalle de ${movie.title}`}
              >
                <Info className="w-4 h-4 text-on-surface-variant hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-primary"
        initial={{ width: 0 }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.8, ease: 'circOut' }}
      />
    </motion.div>
  );
};
