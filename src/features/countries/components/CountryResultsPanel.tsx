import { RefreshCcw, Sparkles } from 'lucide-react';
import { CinematicMovieCard } from '../../../components/CinematicMovieCard';
import { Movie, ViewingStatus } from '../../../types/movie';
import { CountryConfig, FEATURED_COUNTRIES } from '../config/countryConfig';
import { CountryDiscoverySource } from '../services/countryDiscoveryService';

interface CountryResultsPanelProps {
  selectedCountry: CountryConfig | null;
  items: Movie[];
  loading: boolean;
  error: string | null;
  source: CountryDiscoverySource | null;
  hasLoadedCountry: boolean;
  onSelectCountry: (countryMapId: string) => void;
  onClearSelection: () => void;
  onRetry: () => void;
  onInfo: (movie: Movie) => void;
  onSave: (movie: Movie) => Promise<void>;
  isSaved: (movie: Movie) => boolean;
  getStatus: (movie: Movie) => ViewingStatus | undefined;
}

export function CountryResultsPanel({
  selectedCountry,
  items,
  loading,
  error,
  source,
  hasLoadedCountry,
  onSelectCountry,
  onClearSelection,
  onRetry,
  onInfo,
  onSave,
  isSaved,
  getStatus,
}: CountryResultsPanelProps) {
  if (!selectedCountry) {
    return (
      <aside className="glass rounded-3xl border border-white/5 p-6">
        <h2 className="text-2xl font-serif italic mb-3">Descubrimiento por pais</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Selecciona un pais en el mapa o usa un acceso rapido para cargar recomendaciones.
        </p>

        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
            Accesos rapidos
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURED_COUNTRIES.map((country) => (
              <button
                key={country.mapId}
                onClick={() => onSelectCountry(country.mapId)}
                className="px-3 py-2 rounded-full text-xs border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-colors"
              >
                {country.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="glass rounded-3xl border border-white/5 p-6 lg:max-h-[860px] lg:overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Pais seleccionado</p>
          <h2 className="text-2xl font-serif italic">{selectedCountry.label}</h2>
        </div>
        <button
          onClick={onClearSelection}
          className="px-3 py-2 rounded-full border border-white/15 text-xs hover:border-primary/40 hover:bg-primary/10 transition-colors"
        >
          Limpiar seleccion
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-4" role="status" aria-label="Cargando recomendaciones por pais">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] rounded-xl bg-surface-container-highest/20 animate-pulse border border-white/5"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-3" role="alert">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-red-400/40 hover:bg-red-500/10 text-xs transition-colors"
          >
            <RefreshCcw className="w-3 h-3" />
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && hasLoadedCountry && (
        <div className="h-56 rounded-2xl border border-white/10 bg-surface-container-highest/10 flex flex-col items-center justify-center text-center px-5 gap-3" role="status">
          <Sparkles className="w-8 h-8 text-primary/40" />
          <p className="text-sm text-on-surface-variant">
            No encontramos resultados fuertes para {selectedCountry.label}. Prueba otro pais.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
            Fuente: {source === 'text_fallback' ? 'fallback por texto' : 'origen de produccion (TMDB)'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-4">
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
        </div>
      )}
    </aside>
  );
}
