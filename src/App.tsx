import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Sparkles, Archive, Search, Moon, User, LogOut, Info, Loader2, AlertCircle } from 'lucide-react';
import { useGeminiCredentials } from './hooks/useGeminiCredentials';
import { CinematicMovieCard } from './components/CinematicMovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { ExternalApiService } from './services/externalApiService';
import { PlatformStateManager } from './services/platformStateManager';
import { PresentationController } from './services/presentationController';
import { LocalCacheService } from './services/localCacheService';
import { Movie, CachedMovie } from './types/movie';
import { MovieMappers } from './mappers/movieMappers';

const ASTRAL_MESSAGES = [
  "Sifting through the astral records of cinema...",
  "Aligning cinematic resonances with historical echoes...",
  "The Curator is consulting the abyssal archive...",
  "Extracting narratives from the mists of time...",
  "Synchronizing visual metadata with the astral flow..."
];

/**
 * The Living Archive: A sentient repository of cinematic history.
 * Architected with React 18+, TypeScript, and Gemini API (BYOK).
 * Now fully autonomous with local device storage.
 */
export default function App() {
  const { apiKey, isReady, saveKey, clearKey } = useGeminiCredentials();
  const [inputKey, setInputKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalContext, setHistoricalContext] = useState<string>('');
  const [view, setView] = useState<'discover' | 'archive'>('discover');
  const [isNoirMode, setIsNoirMode] = useState(() => {
    return localStorage.getItem('the_living_archive_noir_mode') === 'true';
  });
  const [archivedMovies, setArchivedMovies] = useState<CachedMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(ASTRAL_MESSAGES[0]);
  const [archiveSearch, setArchiveSearch] = useState('');

  // Initial load: Fetch historical context for today
  useEffect(() => {
    if (isReady) {
      ExternalApiService.fetchHistoricalDailyContext().then(setHistoricalContext);
      setArchivedMovies(PlatformStateManager.evaluateCurrentStateSync());
    }
  }, [isReady]);

  // Persist Noir Mode
  useEffect(() => {
    localStorage.setItem('the_living_archive_noir_mode', String(isNoirMode));
  }, [isNoirMode]);

  // Rotate loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = ASTRAL_MESSAGES.indexOf(prev);
          return ASTRAL_MESSAGES[(currentIndex + 1) % ASTRAL_MESSAGES.length];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Refresh archive when switching to archive view
  useEffect(() => {
    if (view === 'archive') {
      setArchivedMovies(PlatformStateManager.evaluateCurrentStateSync());
    }
  }, [view]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      saveKey(inputKey);
    }
  };

  /**
   * Coordinates the saving of a movie to the local archive.
   */
  const handleSaveToArchive = async (movie: Movie) => {
    try {
      const cachedMovie = MovieMappers.toCached(movie);
      await PlatformStateManager.syncToLocalCache(cachedMovie);
      
      setArchivedMovies(PlatformStateManager.evaluateCurrentStateSync());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error saving resonance.";
      setError(message);
      throw err;
    }
  };

  const handleDeleteFromArchive = (title: string, releaseYear: number) => {
    PlatformStateManager.deleteFromLocalCache(title, releaseYear);
    setArchivedMovies(PlatformStateManager.evaluateCurrentStateSync());
  };

  const handleClearVault = () => {
    if (window.confirm("Are you sure you want to clear the entire vault? This action is irreversible.")) {
      LocalCacheService.clearCache();
      setArchivedMovies([]);
    }
  };

  const handleExportVault = () => {
    try {
      const data = LocalCacheService.exportArchive();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `the-living-archive-vault-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export the astral records.");
    }
  };

  const handleImportVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { imported, skipped } = LocalCacheService.importArchive(content);
        setArchivedMovies(PlatformStateManager.evaluateCurrentStateSync());
        alert(`Import successful: ${imported} resonances added, ${skipped} skipped (duplicates).`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to import astral records.";
        setError(message);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  /**
   * The Discovery Flow (Presentation Controller Orchestration):
   * Consolidates all astral nodes into a final UI contract.
   */
  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !apiKey) return;

    setIsLoading(true);
    setError(null);

    try {
      // Presentation Controller consolidates all phases
      const enrichedResults = await PresentationController.discoverCinematicResonances(
        apiKey,
        searchQuery,
        historicalContext
      );

      if (enrichedResults.length === 0) {
        setError("The archive already contains these resonances. Try a different query.");
      } else {
        setRecommendations(enrichedResults);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred in the astral flow.";
      // If the message already contains specific guidance, don't append generic text
      if (message.includes("Astral Key") || message.includes("astral model") || message.includes("congested")) {
        setError(`Discovery Error: ${message}`);
      } else {
        setError(`Error in Discovery: ${message}. Please check your API key or network connection.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArchive = archivedMovies
    .filter(m => m.title.toLowerCase().includes(archiveSearch.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className={`min-h-screen flex flex-col noir-transition ${isNoirMode ? 'grayscale contrast-125 brightness-75' : ''}`}>
      {/* Navigation Rail */}
      <nav className="fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('discover')}>
          <Archive className="text-primary w-6 h-6" />
          <span className="font-serif text-xl font-medium tracking-tight">The Living Archive</span>
        </div>
        <div className="flex items-center gap-8 text-on-surface-variant font-mono text-sm uppercase tracking-widest">
          <button 
            onClick={() => setView('discover')}
            className={`transition-colors ${view === 'discover' ? 'text-on-surface border-b border-primary pb-1' : 'hover:text-on-surface'}`}
            aria-label="Switch to Discover view"
          >
            Discover
          </button>
          <button 
            onClick={() => setView('archive')}
            className={`transition-colors ${view === 'archive' ? 'text-on-surface border-b border-primary pb-1' : 'hover:text-on-surface'}`}
            aria-label="Switch to Archive view"
          >
            The Vault
          </button>
          <button 
            onClick={() => setIsNoirMode(!isNoirMode)}
            className={`transition-colors ${isNoirMode ? 'text-primary' : 'hover:text-on-surface'}`}
            aria-label={isNoirMode ? "Disable Noir Mode" : "Enable Noir Mode"}
          >
            Noir Mode
          </button>
        </div>
        <div className="flex items-center gap-6">
          <button className="hover:text-primary transition-colors" aria-label="Search"><Search className="w-5 h-5" /></button>
          <button 
            onClick={clearKey} 
            className="hover:text-primary transition-colors" 
            aria-label="Logout and clear API key"
            title="Logout and clear API key"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pt-24 px-8 pb-12 relative overflow-hidden">
        {/* Ambient Auras */}
        <div className="astral-aura w-[500px] h-[500px] bg-primary/5 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
        <div className="astral-aura w-[500px] h-[500px] bg-primary/5 bottom-0 right-0 translate-x-1/2 translate-y-1/2" />

        <AnimatePresence mode="wait">
          {!isReady ? (
            <motion.div
              key="blocker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto mt-24 glass p-8 rounded-2xl relative"
            >
              <div className="astral-aura w-64 h-64 bg-primary top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Key className="text-primary w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif mb-2">Astral Connection Required</h2>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    To access the Living Archive, you must provide your own Gemini API key. 
                  </p>
                </div>

                <form onSubmit={handleSaveKey} className="w-full flex flex-col gap-4">
                  <input
                    type="password"
                    placeholder="Enter Gemini API Key..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full bg-surface-container-highest/50 border-b border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full bg-primary text-on-primary py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Initialize Archive
                  </button>
                </form>
              </div>
            </motion.div>
          ) : view === 'discover' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto"
            >
              <header className="mb-16 text-center">
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-6xl md:text-8xl font-serif mb-6 italic tracking-tighter"
                >
                  Discover the Essence
                </motion.h1>
                <div className="max-w-xl mx-auto">
                  <p className="font-mono text-on-surface-variant uppercase tracking-[0.3em] text-[10px] mb-4">
                    Historical Resonance
                  </p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-primary/80 italic leading-relaxed"
                  >
                    {historicalContext || "Sifting through the astral records of cinema..."}
                  </motion.p>
                </div>
              </header>

              {/* Search Bar */}
              <form onSubmit={handleDiscover} className="max-w-2xl mx-auto mb-24 relative">
                <div className="glass p-1 rounded-full flex items-center gap-4 px-6 h-16 shadow-2xl shadow-primary/5">
                  <Sparkles className={`w-6 h-6 ${isLoading ? 'text-primary animate-spin' : 'text-primary'}`} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by mood, visual style, or emotional resonance..."
                    className="flex-1 bg-transparent border-none outline-none text-sm md:text-base placeholder:text-on-surface-variant/40"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="font-mono text-[10px] text-on-surface-variant border border-white/10 px-6 py-3 rounded-full uppercase hover:bg-white/5 transition-colors tracking-widest"
                  >
                    {isLoading ? "Sifting..." : "Discover"}
                  </button>
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-full left-0 right-0 mt-6 p-4 glass border-primary/20 rounded-2xl flex items-center gap-3 text-xs text-primary bg-primary/5"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-full left-0 right-0 mt-6 text-center"
                  >
                    <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-[0.4em] animate-pulse">
                      {loadingMessage}
                    </p>
                  </motion.div>
                )}
              </form>

              {/* Recommendations Section */}
              <section className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 flex flex-col gap-6">
                  <h3 className="text-2xl font-serif italic">
                    {recommendations.length > 0 ? "Astral Resonances" : "The Abyssal Archive"}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed border-l border-primary/30 pl-6 italic">
                    {recommendations.length > 0 
                      ? "The curator has found these cinematic echoes for you. Each one is a bridge between your intent and the flow of history."
                      : "Where shadows coalesce into narratives. A collection of the primal and the profound. Begin your journey by entering a resonance."}
                  </p>
                  {recommendations.length > 0 && (
                    <button 
                      onClick={() => setRecommendations([])}
                      className="text-on-surface-variant hover:text-primary transition-colors font-mono text-[10px] uppercase tracking-widest text-left"
                    >
                      Clear Resonances
                    </button>
                  )}
                </div>
                
                <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence mode="popLayout">
                    {recommendations.length > 0 ? (
                      recommendations.map((movie, i) => (
                        <motion.div
                          key={movie.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <CinematicMovieCard
                            movie={movie}
                            onSave={handleSaveToArchive}
                            onInfo={setSelectedMovie}
                          />
                        </motion.div>
                      ))
                    ) : !isLoading && (
                      <div className="col-span-full flex flex-col items-center justify-center h-80 glass rounded-3xl border-dashed border-white/5">
                        <Sparkles className="w-12 h-12 text-primary/10 mb-6" />
                        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant/40">The archive awaits your intent</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="archive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto"
            >
              <header className="mb-16 flex flex-col md:flex-row items-end justify-between gap-8">
                <div className="text-left">
                  <h1 className="text-6xl font-serif mb-4 italic">The Vault</h1>
                  <p className="font-mono text-on-surface-variant uppercase tracking-[0.3em] text-[10px]">
                    {archivedMovies.length} Resonances Persisted
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
                  <div className="glass rounded-full px-6 py-3 flex items-center gap-3 flex-1 md:w-64">
                    <Search className="w-4 h-4 text-on-surface-variant" />
                    <input 
                      type="text"
                      placeholder="Filter the vault..."
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs w-full"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleExportVault}
                      className="text-on-surface-variant hover:text-primary transition-colors font-mono text-[10px] uppercase tracking-widest"
                      aria-label="Export vault to JSON"
                    >
                      Export
                    </button>
                    <label 
                      className="text-on-surface-variant hover:text-primary transition-colors font-mono text-[10px] uppercase tracking-widest cursor-pointer"
                      aria-label="Import vault from JSON"
                    >
                      Import
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleImportVault} 
                        className="hidden" 
                      />
                    </label>
                    <button 
                      onClick={handleClearVault}
                      className="text-on-surface-variant hover:text-red-400 transition-colors font-mono text-[10px] uppercase tracking-widest whitespace-nowrap"
                      aria-label="Clear entire vault"
                    >
                      Clear Vault
                    </button>
                  </div>
                </div>
              </header>

              <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredArchive.length > 0 ? (
                    filteredArchive.map((movie, i) => (
                      <motion.div
                        key={movie.title}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <CinematicMovieCard
                          movie={movie}
                          onDelete={handleDeleteFromArchive}
                          onInfo={setSelectedMovie}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center h-96 glass rounded-3xl border-dashed border-white/10">
                      <Archive className="w-12 h-12 text-primary/20 mb-6" />
                      <h3 className="text-xl font-serif italic mb-2">
                        {archiveSearch ? "No resonances match your filter" : "The Vault is Empty"}
                      </h3>
                      <p className="text-on-surface-variant text-sm font-mono uppercase tracking-widest">
                        {archiveSearch ? "Try a different search term" : "No cinematic echoes have been persisted yet."}
                      </p>
                      {!archiveSearch && (
                        <button 
                          onClick={() => setView('discover')}
                          className="mt-8 text-primary hover:underline font-mono text-xs uppercase tracking-widest"
                        >
                          Begin Discovery
                        </button>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <MovieDetailModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)}
          historicalContext={historicalContext}
        />

        {/* Footer */}
        {isReady && (
          <footer className="mt-32 flex items-center justify-between border-t border-white/5 pt-8 font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
            <div className="flex gap-8">
              <span>Node_Link: Successful</span>
              <span>Vault_Status: {archivedMovies.length > 0 ? 'Active' : 'Empty'}</span>
              <span>Chrono_Status: Stable</span>
            </div>
            <button 
              onClick={clearKey}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Disconnect Archive
            </button>
          </footer>
        )}
      </main>
    </div>
  );
}
