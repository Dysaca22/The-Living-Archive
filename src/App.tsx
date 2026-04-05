import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './app/AppLayout';

const HomePage = lazy(async () => {
  const module = await import('./pages/HomePage');
  return { default: module.HomePage };
});

const SearchPage = lazy(async () => {
  const module = await import('./pages/SearchPage');
  return { default: module.SearchPage };
});

const CountriesPage = lazy(async () => {
  const module = await import('./pages/CountriesPage');
  return { default: module.CountriesPage };
});

const CategoryPage = lazy(async () => {
  const module = await import('./pages/CategoryPage');
  return { default: module.CategoryPage };
});

const VaultPage = lazy(async () => {
  const module = await import('./pages/VaultPage');
  return { default: module.VaultPage };
});

function RouteFallback() {
  return (
    <div className="max-w-7xl mx-auto h-[40vh] flex items-center justify-center">
      <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">Cargando vista...</p>
    </div>
  );
}

/**
 * Lightweight app shell with route composition only.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/buscar" element={<SearchPage />} />
            <Route path="/paises" element={<CountriesPage />} />
            <Route path="/categoria/:slug" element={<CategoryPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
