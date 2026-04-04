import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './app/AppLayout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { CountriesPage } from './pages/CountriesPage';
import { CategoryPage } from './pages/CategoryPage';
import { VaultPage } from './pages/VaultPage';

/**
 * Lightweight app shell with route composition only.
 */
export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
