import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Key, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useGeminiCredentials } from '../hooks/useGeminiCredentials';
import { useDiscovery } from '../features/discovery/hooks/useDiscovery';
import { useQuoteSceneSearch } from '../features/discovery/hooks/useQuoteSceneSearch';
import { useVault } from '../features/vault/hooks/useVault';
import { Movie } from '../types/movie';
import { CinematicMovieCard } from '../components/CinematicMovieCard';
import { MovieDetailModal } from '../components/MovieDetailModal';
import { Toast, ToastType } from '../components/Toast';
import { AI_CONFIG } from '../constants/aiConfig';

type SearchMode = 'quote_scene' | 'general';

const EXAMPLE_QUERIES = [
  'frase sobre no poder rechazar una oferta',
  'escena de baile en escaleras con musica disco',
  'monologo sobre lluvia y lagrimas',
  'escena de persecucion en tren con tension',
  'frase de despedida en aeropuerto',
  'descripcion de escena en un motel y suspense',
];

function getModeFromParams(value: string | null): SearchMode {
  return value === 'general' ? 'general' : 'quote_scene';
}

function getConfidenceLabel(score: number): string {
  if (score >= 0.75) return 'alta';
  if (score >= 0.55) return 'media';
  return 'baja';
}

function getMatchModeLabel(mode: 'quote_exact' | 'scene_description' | 'theme_similarity'): string {
  switch (mode) {
    case 'quote_exact':
      return 'cita exacta';
    case 'scene_description':
      return 'descripcion de escena';
    default:
      return 'similitud tematica';
  }
}

export function SearchPage() {
  const { apiKey, isReady, saveKey } = useGeminiCredentials();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<SearchMode>(() => getModeFromParams(searchParams.get('modo')));
  const [inputKey, setInputKey] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [generalCount, setGeneralCount] = useState(AI_CONFIG.DEFAULT_GENERAL_COUNT);
  const [quoteCount, setQuoteCount] = useState(AI_CONFIG.DEFAULT_QUOTE_SCENE_COUNT);
  const lastAutoQueryRef = useRef<string | null>(null);

  const generalSearch = useDiscovery(apiKey, isReady, {
    count: generalCount,
    enabled: mode === 'general',
  });
  const quoteSceneSearch = useQuoteSceneSearch(apiKey, isReady, {
    count: quoteCount,
    enabled: mode === 'quote_scene',
  });

  const {
    saveMovie,
    deleteMovieByReference,
    updateStatusByReference,
    updateRatingByReference,
    updateNotesByReference,
    isSaved,
    getRecord,
  } = useVault();

  useEffect(() => {
    const modeFromUrl = getModeFromParams(searchParams.get('modo'));
    if (modeFromUrl !== mode) {
      setMode(modeFromUrl);
    }
  }, [mode, searchParams]);

  useEffect(() => {
    const queryFromUrl = searchParams.get('q')?.trim();
    if (!queryFromUrl) {
      lastAutoQueryRef.current = null;
      return;
    }

    const key = `${mode}:${queryFromUrl}`;
    if (lastAutoQueryRef.current === key) {
      return;
    }

    lastAutoQueryRef.current = key;

    if (mode === 'quote_scene') {
      quoteSceneSearch.setQuery(queryFromUrl);
      if (isReady && apiKey) {
        void quoteSceneSearch.search(queryFromUrl);
      }
      return;
    }

    generalSearch.setSearchQuery(queryFromUrl);
    if (isReady && apiKey) {
      void generalSearch.performSearch(queryFromUrl);
    }
  }, [
    apiKey,
    isReady,
    mode,
    searchParams,
    generalSearch.setSearchQuery,
    generalSearch.performSearch,
    quoteSceneSearch.setQuery,
    quoteSceneSearch.search,
  ]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const updateRouteState = (nextMode: SearchMode, nextQuery: string) => {
    const params = new URLSearchParams();
    params.set('modo', nextMode);
    if (nextQuery.trim()) {
      params.set('q', nextQuery.trim());
    }
    setSearchParams(params);
  };

  const handleSearchSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (mode === 'quote_scene') {
      await quoteSceneSearch.search(quoteSceneSearch.query);
      updateRouteState(mode, quoteSceneSearch.query);
      return;
    }

    await generalSearch.performSearch(generalSearch.searchQuery);
    updateRouteState(mode, generalSearch.searchQuery);
  };

  const handleSaveKey = (event: FormEvent) => {
    event.preventDefault();
    if (!inputKey.trim()) return;
    saveKey(inputKey);
  };

  const handleModeChange = (nextMode: SearchMode) => {
    setMode(nextMode);
    const activeQuery = nextMode === 'quote_scene' ? quoteSceneSearch.query : generalSearch.searchQuery;
    updateRouteState(nextMode, activeQuery);
  };

  const handleQuickExample = async (example: string) => {
    setMode('quote_scene');
    quoteSceneSearch.setQuery(example);
    updateRouteState('quote_scene', example);
    await quoteSceneSearch.search(example);
  };

  const handleContextClick = async () => {
    const context = mode === 'quote_scene' ? quoteSceneSearch.historicalContext : generalSearch.historicalContext;
    if (!context) return;

    const contextTerms = context.split(' ').slice(0, 6).join(' ');
    if (mode === 'quote_scene') {
      quoteSceneSearch.setQuery(contextTerms);
      updateRouteState('quote_scene', contextTerms);
      await quoteSceneSearch.search(contextTerms);
    } else {
      generalSearch.setSearchQuery(contextTerms);
      updateRouteState('general', contextTerms);
      await generalSearch.performSearch(contextTerms);
    }

    showToast('Contexto diario aplicado a la busqueda.', 'info');
  };

  const handleSaveToArchive = async (movie: Movie) => {
    try {
      await saveMovie(movie);
      showToast('Titulo guardado en la boveda.', 'success');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'No se pudo guardar el titulo.';
      showToast(message, 'error');
      throw saveError;
    }
  };

  const handleDeleteFromArchive = (movie: Movie) => {
    deleteMovieByReference(movie);
    showToast('Titulo eliminado de la boveda.', 'info');
  };

  const handleUpdateStatus = (movie: Movie, status: 'no_visto' | 'en_proceso' | 'visto') => {
    updateStatusByReference(movie, status);
    showToast('Estado actualizado.', 'info');
  };

  const handleUpdateRating = (movie: Movie, rating: number) => {
    updateRatingByReference(movie, rating);
    showToast(`Calificacion personal: ${rating}/5.`, 'info');
  };

  const handleUpdateNotes = (movie: Movie, notes: string) => {
    updateNotesByReference(movie, notes);
    showToast('Notas guardadas.', 'info');
  };

  const selectedRecord = getRecord(selectedMovie);

  const quoteLowConfidenceCount = useMemo(
    () => quoteSceneSearch.results.filter((result) => result.confidenceScore < 0.55).length,
    [quoteSceneSearch.results]
  );
  const quoteAllNonExact = useMemo(
    () =>
      quoteSceneSearch.results.length > 0 &&
      quoteSceneSearch.results.every((result) => result.matchMode !== 'quote_exact'),
    [quoteSceneSearch.results]
  );

  const activeHistoricalContext =
    mode === 'quote_scene' ? quoteSceneSearch.historicalContext : generalSearch.historicalContext;

  if (!isReady) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto mt-24 glass p-8 rounded-2xl relative"
      >
        <div className="astral-aura w-64 h-64 bg-primary top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="text-primary w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-serif mb-2">Conexion requerida</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Para usar busqueda con IA, configura tu clave API de Gemini.
            </p>
          </div>
          <form onSubmit={handleSaveKey} className="w-full flex flex-col gap-4">
            <input
              type="password"
              placeholder="Ingresa tu clave API de Gemini..."
              value={inputKey}
              onChange={(event) => setInputKey(event.target.value)}
              aria-label="Clave API de Gemini"
              className="w-full bg-surface-container-highest/50 border-b border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors font-mono"
            />
            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Activar buscador
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  const renderQuoteSceneResults = () => {
    if (quoteSceneSearch.isLoading) {
      return (
        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: quoteCount }).map((_, index) => (
            <div key={index} className="aspect-[2/3] rounded-xl bg-surface-container-highest/20 animate-pulse border border-white/5" />
          ))}
        </div>
      );
    }

    if (quoteSceneSearch.results.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center h-80 glass rounded-3xl border-dashed border-white/5" role="status">
          <Sparkles className="w-12 h-12 text-primary/10 mb-6" />
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant/40 text-center px-4">
            {quoteSceneSearch.hasSearched
              ? 'Sin coincidencias claras. Prueba otra frase o agrega mas contexto.'
              : 'Busca por frase memorable, escena conocida o descripcion parcial.'}
          </p>
        </div>
      );
    }

    return (
      <div className="col-span-full">
        {(quoteAllNonExact || quoteLowConfidenceCount > 0) && (
          <div className="mb-6 space-y-3">
            {quoteAllNonExact && (
              <div className="glass border border-blue-400/30 bg-blue-500/5 rounded-2xl px-4 py-3 text-sm text-blue-200">
                La consulta parece descripcion de escena y no cita textual exacta. Las coincidencias reflejan interpretacion de contexto.
              </div>
            )}
            {quoteLowConfidenceCount > 0 && (
              <div className="glass border border-amber-400/30 bg-amber-500/5 rounded-2xl px-4 py-3 text-sm text-amber-200">
                Hay {quoteLowConfidenceCount} resultado(s) con confianza baja. Revisa ambiguedades antes de tomarlo como match definitivo.
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {quoteSceneSearch.results.map((result, index) => (
            <motion.div
              key={`${result.movie.mediaType}-${result.movie.tmdbId ?? `${result.movie.title}-${result.movie.releaseYear}`}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="space-y-3"
            >
              <CinematicMovieCard
                movie={result.movie}
                onSave={handleSaveToArchive}
                onInfo={setSelectedMovie}
                isSaved={isSaved(result.movie)}
                status={getRecord(result.movie)?.status}
              />

              <div className="glass rounded-2xl border border-white/10 p-4 space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  Coincidencia: {getMatchModeLabel(result.matchMode)} | Confianza {getConfidenceLabel(result.confidenceScore)} ({Math.round(result.confidenceScore * 100)}%)
                </p>
                <p className="text-xs text-on-surface-variant leading-relaxed">{result.matchExplanation}</p>
                {result.matchedQuote && (
                  <p className="text-xs italic text-on-surface">
                    Cita detectada: "{result.matchedQuote}"
                  </p>
                )}
                {result.ambiguityNote && (
                  <p className="text-xs text-amber-300">Ambiguedad: {result.ambiguityNote}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderGeneralResults = () => {
    if (generalSearch.isLoading) {
      return (
        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: generalCount }).map((_, index) => (
            <div key={index} className="aspect-[2/3] rounded-xl bg-surface-container-highest/20 animate-pulse border border-white/5" />
          ))}
        </div>
      );
    }

    if (generalSearch.recommendations.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center h-80 glass rounded-3xl border-dashed border-white/5" role="status">
          <Sparkles className="w-12 h-12 text-primary/10 mb-6" />
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant/40 text-center px-4">
            {generalSearch.hasSearched
              ? 'Sin coincidencias en descubrimiento general. Ajusta la consulta.'
              : 'Inicia con una consulta de descubrimiento general.'}
          </p>
        </div>
      );
    }

    return (
      <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {generalSearch.recommendations.map((movie, index) => (
          <motion.div
            key={`${movie.mediaType}-${movie.tmdbId ?? `${movie.title}-${movie.releaseYear}`}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <CinematicMovieCard
              movie={movie}
              onSave={handleSaveToArchive}
              onInfo={setSelectedMovie}
              isSaved={isSaved(movie)}
              status={getRecord(movie)?.status}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  const activeError = mode === 'quote_scene' ? quoteSceneSearch.error : generalSearch.error;
  const activeLoadingMessage = mode === 'quote_scene' ? quoteSceneSearch.loadingMessage : generalSearch.loadingMessage;
  const activeQuery = mode === 'quote_scene' ? quoteSceneSearch.query : generalSearch.searchQuery;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-12 text-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl md:text-7xl font-serif mb-4 italic tracking-tighter"
        >
          Busqueda de cine y series
        </motion.h1>
        <p className="text-on-surface-variant max-w-3xl mx-auto leading-relaxed">
          Busca por frase memorable, escena conocida o descripcion parcial. Si prefieres, tambien puedes usar descubrimiento general.
        </p>
      </header>

      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <button
            onClick={() => handleModeChange('quote_scene')}
            className={`px-5 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors border ${
              mode === 'quote_scene'
                ? 'bg-primary text-on-primary border-primary'
                : 'border-white/10 text-on-surface-variant hover:border-primary/40'
            }`}
          >
            Frases y escenas
          </button>
          <button
            onClick={() => handleModeChange('general')}
            className={`px-5 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors border ${
              mode === 'general'
                ? 'bg-primary text-on-primary border-primary'
                : 'border-white/10 text-on-surface-variant hover:border-primary/40'
            }`}
          >
            Descubrimiento general
          </button>
          <div className="flex items-center gap-2 glass rounded-full px-3 py-2 border border-white/10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Cantidad</span>
            <select
              value={mode === 'quote_scene' ? quoteCount : generalCount}
              onChange={(event) => {
                const nextValue = Number.parseInt(event.target.value, 10);
                if (mode === 'quote_scene') {
                  setQuoteCount(nextValue);
                } else {
                  setGeneralCount(nextValue);
                }
              }}
              aria-label="Cantidad de resultados"
              className="bg-transparent text-xs outline-none border-none"
            >
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>

        {mode === 'quote_scene' && (
          <div className="max-w-4xl mx-auto mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-surface-variant mb-3 text-center">
              Ejemplos rapidos
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUERIES.map((example) => (
                <button
                  key={example}
                  onClick={() => void handleQuickExample(example)}
                  className="px-3 py-2 rounded-full border border-white/10 hover:border-primary/40 hover:bg-primary/10 transition-colors text-xs"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-xl mx-auto text-center mb-8">
          <p className="font-mono text-on-surface-variant uppercase tracking-[0.3em] text-[10px] mb-3">
            Contexto del dia
          </p>
          <button
            onClick={() => void handleContextClick()}
            className="text-sm text-primary/80 italic leading-relaxed hover:text-primary transition-colors"
          >
            {activeHistoricalContext || 'Cargando efemeride del dia...'}
          </button>
        </div>
      </section>

      <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto mb-16 relative">
        <div className="glass p-1 rounded-full flex items-center gap-4 px-6 h-16 shadow-2xl shadow-primary/5 focus-within:border-primary/50">
          <Sparkles className={`w-6 h-6 ${mode === 'quote_scene' ? 'text-primary' : 'text-on-surface-variant'}`} />
          <input
            type="text"
            value={activeQuery}
            onChange={(event) => {
              if (mode === 'quote_scene') {
                quoteSceneSearch.setQuery(event.target.value);
              } else {
                generalSearch.setSearchQuery(event.target.value);
              }
            }}
            aria-label={mode === 'quote_scene' ? 'Busqueda por frases o escenas' : 'Busqueda de descubrimiento general'}
            placeholder={
              mode === 'quote_scene'
                ? "Ej: 'escena de brindis en barco con final tragico'"
                : 'Ej: thriller europeo con tension psicologica'
            }
            className="flex-1 bg-transparent border-none outline-none text-sm md:text-base placeholder:text-on-surface-variant/40"
          />
          <button
            type="submit"
            className="font-mono text-xs text-on-surface-variant border border-white/10 px-6 py-3 rounded-full uppercase hover:bg-white/5 transition-colors tracking-widest"
          >
            {mode === 'quote_scene' ? 'Buscar coincidencias' : 'Descubrir'}
          </button>
        </div>

        <AnimatePresence>
          {activeError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-full left-0 right-0 mt-4 p-4 glass border-primary/20 rounded-2xl flex items-center gap-3 text-xs text-primary bg-primary/5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {activeError}
            </motion.div>
          )}
        </AnimatePresence>

        {(quoteSceneSearch.isLoading || generalSearch.isLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-full left-0 right-0 mt-4 text-center"
            role="status"
          >
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-[0.4em] animate-pulse">
              {activeLoadingMessage}
            </p>
          </motion.div>
        )}
      </form>

      <section className="grid grid-cols-1">
        {mode === 'quote_scene' ? renderQuoteSceneResults() : renderGeneralResults()}
      </section>

      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onSave={handleSaveToArchive}
        onDelete={handleDeleteFromArchive}
        onUpdateStatus={handleUpdateStatus}
        onUpdateRating={handleUpdateRating}
        onUpdateNotes={handleUpdateNotes}
        onNavigateToMovie={setSelectedMovie}
        isSaved={selectedMovie ? isSaved(selectedMovie) : false}
        currentStatus={selectedRecord?.status}
        currentRating={selectedRecord?.userRating}
        currentNotes={selectedRecord?.userNotes}
        historicalContext={activeHistoricalContext}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
