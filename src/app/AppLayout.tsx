import { Archive, LogOut, Moon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useGeminiCredentials } from '../hooks/useGeminiCredentials';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/buscar', label: 'Buscar' },
  { to: '/paises', label: 'Países' },
  { to: '/vault', label: 'Bóveda' },
];

export function AppLayout() {
  const { isReady, clearKey } = useGeminiCredentials();
  const [isNoirMode, setIsNoirMode] = useState(() => {
    return localStorage.getItem('the_living_archive_noir_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('the_living_archive_noir_mode', String(isNoirMode));
  }, [isNoirMode]);

  const appContainerClass = useMemo(
    () =>
      `min-h-screen flex flex-col noir-transition custom-scrollbar ${
        isNoirMode ? 'grayscale contrast-125 brightness-75' : ''
      }`,
    [isNoirMode]
  );

  return (
    <div className={appContainerClass}>
      <nav className="fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center justify-between px-4 md:px-8">
        <NavLink to="/" className="flex items-center gap-2">
          <Archive className="text-primary w-5 h-5 md:w-6 md:h-6" />
          <span className="font-serif text-lg md:text-xl font-medium tracking-tight hidden sm:block">The Living Archive</span>
        </NavLink>

        <div className="flex items-center gap-4 md:gap-8 text-on-surface-variant font-mono text-xs md:text-sm uppercase tracking-widest">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-2 py-1 ${
                  isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(255,77,0,0.5)]' : 'hover:text-on-surface'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => setIsNoirMode((previous) => !previous)}
            className={`p-2 rounded-full transition-all duration-500 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              isNoirMode
                ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'text-on-surface-variant hover:text-primary hover:bg-white/5'
            }`}
            aria-label={isNoirMode ? 'Disable Noir Mode' : 'Enable Noir Mode'}
            title={isNoirMode ? 'Disable Noir Mode' : 'Enable Noir Mode'}
          >
            <Moon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <button
          onClick={clearKey}
          className="hover:text-primary transition-colors text-on-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded p-1"
          aria-label="Logout and clear API key"
          title="Logout and clear API key"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </nav>

      <main className="flex-1 pt-20 md:pt-24 px-4 md:px-8 pb-12 relative overflow-hidden">
        <div className="astral-aura dynamic-aura w-[500px] h-[500px] top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
        <div className="astral-aura dynamic-aura w-[500px] h-[500px] bottom-0 right-0 translate-x-1/2 translate-y-1/2" />
        <Outlet />
      </main>

      <footer className="px-4 md:px-8 py-6 border-t border-white/5 font-mono text-xs text-on-surface-variant uppercase tracking-widest text-center md:text-left">
        {isReady ? 'Gemini Key: Activa' : 'Gemini Key: Pendiente'}
      </footer>
    </div>
  );
}
