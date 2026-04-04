import React from 'react';
import { Clock, CheckCircle2, Archive as ArchiveIcon, LayoutGrid } from 'lucide-react';
import { ViewingStatus } from '../types/movie';

interface VaultFiltersProps {
  currentFilter: ViewingStatus | 'all';
  onFilterChange: (filter: ViewingStatus | 'all') => void;
}

export const VaultFilters: React.FC<VaultFiltersProps> = ({ currentFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'Todos', icon: LayoutGrid },
    { id: 'no_visto', label: 'No visto', icon: Clock },
    { id: 'en_proceso', label: 'En proceso', icon: ArchiveIcon },
    { id: 'visto', label: 'Visto', icon: CheckCircle2 },
  ] as const;

  return (
    <div className="flex items-center gap-2 p-1 bg-surface-container-highest/20 rounded-2xl border border-white/5 w-full md:w-auto">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
            currentFilter === filter.id 
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
              : 'text-on-surface-variant hover:bg-white/5'
          }`}
        >
          <filter.icon className="w-3 h-3" />
          <span className="hidden sm:inline">{filter.label}</span>
        </button>
      ))}
    </div>
  );
};
