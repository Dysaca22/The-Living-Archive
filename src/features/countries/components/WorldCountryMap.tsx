import { KeyboardEvent, useMemo, useState } from 'react';
import { COUNTRY_CATALOG, FEATURED_COUNTRIES, getCountryByMapId } from '../config/countryConfig';
import { WORLD_MAP } from '../config/worldMapData';

interface WorldCountryMapProps {
  selectedCountryMapId: string | null;
  onSelectCountry: (countryMapId: string) => void;
}

const FEATURED_COUNTRY_IDS = new Set(FEATURED_COUNTRIES.map((country) => country.mapId));

export function WorldCountryMap({ selectedCountryMapId, onSelectCountry }: WorldCountryMapProps) {
  const [hoveredCountryMapId, setHoveredCountryMapId] = useState<string | null>(null);

  const hoveredCountry = useMemo(
    () => (hoveredCountryMapId ? getCountryByMapId(hoveredCountryMapId) : undefined),
    [hoveredCountryMapId]
  );

  const selectedCountry = selectedCountryMapId ? getCountryByMapId(selectedCountryMapId) : undefined;

  const hoveredLabel = hoveredCountry?.label;
  const selectedLabel = selectedCountry?.label;

  const handleCountryKeyDown = (event: KeyboardEvent<SVGPathElement>, countryMapId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectCountry(countryMapId);
    }
  };

  return (
    <section className="glass rounded-3xl p-6 border border-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-serif italic">Mapa del mundo</h2>
          <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest mt-2">
            Haz clic o presiona Enter en un pais para activar el descubrimiento
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Pais visible</p>
          <p className="text-sm">{hoveredLabel ?? selectedLabel ?? 'Ninguno'}</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <svg
          viewBox={WORLD_MAP.viewBox}
          className="w-full min-w-[760px] h-auto"
          role="img"
          aria-label="Mapa mundial interactivo"
        >
          {WORLD_MAP.locations.map((location) => {
            const isSelected = selectedCountryMapId === location.id;
            const isFeatured = FEATURED_COUNTRY_IDS.has(location.id);

            return (
              <path
                key={location.id}
                d={location.path}
                onClick={() => onSelectCountry(location.id)}
                onKeyDown={(event) => handleCountryKeyDown(event, location.id)}
                onMouseEnter={() => setHoveredCountryMapId(location.id)}
                onMouseLeave={() => setHoveredCountryMapId(null)}
                className="cursor-pointer transition-colors duration-150"
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Seleccionar ${getCountryByMapId(location.id)?.label ?? location.name}`}
                style={{
                  fill: isSelected
                    ? 'rgba(255, 77, 0, 0.9)'
                    : isFeatured
                      ? 'rgba(255, 77, 0, 0.28)'
                      : 'rgba(255, 255, 255, 0.12)',
                  stroke: isSelected ? 'rgba(255, 77, 0, 1)' : 'rgba(255, 255, 255, 0.25)',
                  strokeWidth: isSelected ? 1.1 : 0.45,
                }}
              >
                <title>{getCountryByMapId(location.id)?.label ?? location.name}</title>
              </path>
            );
          })}
        </svg>
      </div>

      <p className="mt-4 text-xs text-on-surface-variant">
        Cobertura: {COUNTRY_CATALOG.length} paises disponibles en mapa.
      </p>
    </section>
  );
}
