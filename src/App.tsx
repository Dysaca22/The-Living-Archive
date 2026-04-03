import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Sparkles, Archive, Search, Moon, User, LogOut, Info, Loader2, AlertCircle } from 'lucide-react';
import { useGeminiCredentials } from './hooks/useGeminiCredentials';
import { CinematicMovieCard } from './components/CinematicMovieCard';
import { GeminiService } from './services/geminiService';
import { ExternalApiService } from './services/externalApiService';
import { GoogleSheetsIntegrationService } from './services/googleSheetsIntegrationService';
import { PlatformStateManager } from './services/platformStateManager';
import { PresentationController } from './services/presentationController';
import { Movie } from './schemas/movieSchema';

/**
 * The Living Archive: A sentient repository of cinematic history.
 * Architected with React 18+, TypeScript, and Gemini API (BYOK).
 */
export default function App() {
  const { apiKey, isReady, saveKey, clearKey } = useGeminiCredentials();
  const [inputKey, setInputKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalContext, setHistoricalContext] = useState<string>('');

  // Initial load: Fetch historical context for today
  useEffect(() => {
    if (isReady) {
      ExternalApiService.fetchHistoricalDailyContext().then(setHistoricalContext);
    }
  }, [isReady]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      saveKey(inputKey);
    }
  };

  /**
   * Coordinates the saving of a movie to the archive.
   */
  const handleSaveToArchive = async (movie: { title: string; year: number; id: number }) => {
    try {
      await PlatformStateManager.syncToSheetsProxy(movie);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
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
    } catch (err: any) {
      const message = err.message || "An unknown error occurred in the astral flow.";
      setError(`Error in Discovery: ${message}. Please check your API key or network connection.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Rail */}
      <nav className="fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <Archive className="text-primary w-6 h-6" />
          <span className="font-serif text-xl font-medium tracking-tight">The Living Archive</span>
        </div>
        <div className="flex items-center gap-8 text-on-surface-variant font-mono text-sm uppercase tracking-widest">
          <button className="hover:text-on-surface transition-colors">Archive</button>
          <button className="text-on-surface border-b border-primary pb-1">Discover</button>
          <button className="hover:text-on-surface transition-colors">Noir Mode</button>
        </div>
        <div className="flex items-center gap-6">
          <button className="hover:text-primary transition-colors"><Moon className="w-5 h-5" /></button>
          <button className="hover:text-primary transition-colors"><Search className="w-5 h-5" /></button>
          <button className="hover:text-primary transition-colors"><User className="w-5 h-5" /></button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pt-24 px-8 pb-12 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!isReady ? (
            /* Credentials Blocker */
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
          ) : (
            /* Main Dashboard */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-7xl mx-auto"
            >
              <header className="mb-16 text-center">
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-6xl font-serif mb-4 italic"
                >
                  Discover the Essence
                </motion.h1>
                <p className="font-mono text-on-surface-variant uppercase tracking-[0.3em] text-xs">
                  {historicalContext || "Sift through the astral records of cinema"}
                </p>
              </header>

              {/* Search Bar */}
              <form onSubmit={handleDiscover} className="max-w-2xl mx-auto mb-24 relative">
                <div className="glass p-1 rounded-full flex items-center gap-4 px-6 h-14">
                  <Sparkles className={`w-5 h-5 ${isLoading ? 'text-primary animate-spin' : 'text-primary'}`} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by mood, visual style, or emotional resonance..."
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="font-mono text-[10px] text-on-surface-variant border border-white/10 px-4 py-2 rounded-full uppercase hover:bg-white/5 transition-colors"
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
                      className="absolute top-full left-0 right-0 mt-4 p-4 glass border-primary/20 rounded-xl flex items-center gap-3 text-xs text-primary"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Recommendations Section */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="col-span-1 flex flex-col gap-4">
                  <h3 className="text-xl font-serif italic">
                    {recommendations.length > 0 ? "Astral Resonances" : "The Abyssal Archive"}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed border-l border-primary/30 pl-4">
                    {recommendations.length > 0 
                      ? "The curator has found these cinematic echoes for you."
                      : "Where shadows coalesce into narratives. A collection of the primal and the profound."}
                  </p>
                </div>
                
                <AnimatePresence mode="popLayout">
                  {recommendations.length > 0 ? (
                    recommendations.map((movie: any, i) => (
                      <motion.div
                        key={movie.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <CinematicMovieCard
                          movieTitle={movie.title}
                          posterImageSource={movie.poster}
                          releaseYear={movie.release_year}
                          genre={movie.soundtrack_highlight}
                          tmdbId={movie.tmdb_database_id}
                          onSave={handleSaveToArchive}
                        />
                      </motion.div>
                    ))
                  ) : (
                    /* Default Mockup if no results */
                    <div className="col-span-2 flex items-center justify-center h-64 border border-dashed border-white/5 rounded-2xl">
                      <div className="text-center text-on-surface-variant">
                        <Archive className="w-8 h-8 mx-auto mb-4 opacity-20" />
                        <p className="text-xs font-mono uppercase tracking-widest">Enter a query to begin discovery</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </section>

              {/* Footer */}
              <footer className="mt-32 flex items-center justify-between border-t border-white/5 pt-8 font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                <div className="flex gap-8">
                  <span>Node_Link: Successful</span>
                  <span>Astral_Depth: 142.4km</span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
