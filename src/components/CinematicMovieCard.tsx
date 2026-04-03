import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { extractColors } from 'extract-colors';
import { Sparkles, Info, Save, Check } from 'lucide-react';

interface CinematicMovieCardProps {
  movieTitle: string;
  posterImageSource: string;
  releaseYear?: number;
  genre?: string;
  tmdbId?: number;
  onSave?: (movie: { title: string; year: number; id: number }) => Promise<void>;
}

/**
 * CinematicMovieCard: A high-performance React component that extracts
 * the dominant color from a movie poster and applies it as a dynamic background glow.
 */
export const CinematicMovieCard: React.FC<CinematicMovieCardProps> = ({
  movieTitle,
  posterImageSource,
  releaseYear,
  genre,
  tmdbId,
  onSave
}) => {
  const [dominantColor, setDominantColor] = useState<string>('rgba(255, 77, 0, 0.15)');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSave || isSaved || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        title: movieTitle,
        year: releaseYear || 0,
        id: tmdbId || 0
      });
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save movie:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const extractColorFromImage = async () => {
      if (imgRef.current && imgRef.current.complete) {
        try {
          // Extract colors from the image using the high-performance library
          const colors = await extractColors(posterImageSource, {
            crossOrigin: 'anonymous',
            pixels: 10000, // Downscale for performance
            distance: 0.22, // Minimum distance between colors
          });

          if (colors.length > 0) {
            // Select the most prominent color
            const primary = colors[0];
            setDominantColor(`rgba(${primary.red}, ${primary.green}, ${primary.blue}, 0.2)`);
          }
        } catch (error) {
          console.error('Failed to extract color from poster:', error);
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
  }, [posterImageSource]);

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="group relative aspect-[2/3] rounded-xl overflow-hidden glass transition-all duration-700"
      style={{
        // Dynamic shadow/glow based on the dominant color
        boxShadow: `0 20px 40px -15px ${dominantColor.replace('0.2', '0.1')}`,
      }}
    >
      {/* Astral Aura: Dynamic background glow */}
      <div 
        className="absolute inset-0 -z-10 blur-[100px] transition-colors duration-1000"
        style={{ backgroundColor: dominantColor }}
      />

      <AnimatePresence mode="wait">
        {!isLoaded && (
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

      <img
        ref={imgRef}
        src={posterImageSource}
        alt={movieTitle}
        crossOrigin="anonymous" // Crucial for CORS pixel access
        onLoad={() => setIsLoaded(true)}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-all duration-1000 ${
          isLoaded ? 'opacity-60 group-hover:opacity-90 grayscale-[0.3] group-hover:grayscale-0' : 'opacity-0'
        }`}
      />

      {/* Tonal Layering: Abyssal Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/20 to-transparent" />

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <div className="flex flex-col gap-1">
          {genre && (
            <span className="font-mono text-[10px] text-primary uppercase tracking-widest mb-1 block opacity-80 group-hover:opacity-100 transition-opacity">
              {genre}
            </span >
          )}
          <h4 className="text-2xl font-serif leading-tight group-hover:text-primary transition-colors duration-500">
            {movieTitle}
          </h4>
          <div className="flex items-center gap-3 mt-2">
            {releaseYear && (
              <span className="font-mono text-[10px] text-on-surface-variant">
                {releaseYear}
              </span>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase font-mono tracking-widest ${
                isSaved ? 'text-green-400' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {isSaving ? (
                <span className="animate-pulse">Archiving...</span>
              ) : isSaved ? (
                <>
                  <Check className="w-3 h-3" />
                  Archived
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Archive
                </>
              )}
            </button>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Info className="w-4 h-4 text-on-surface-variant hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Astral Flow Detail: Subtle glowing line at the bottom */}
      <motion.div 
        className="absolute bottom-0 left-0 h-[2px] bg-primary"
        initial={{ width: 0 }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.8, ease: "circOut" }}
      />
    </motion.div>
  );
};
