import { WORLD_MAP } from './worldMapData';

interface CountryOverrides {
  label?: string;
  fallbackQuery?: string;
}

export interface CountryConfig {
  mapId: string;
  countryCode: string;
  mapName: string;
  label: string;
  fallbackQuery: string;
}

const COUNTRY_OVERRIDES: Record<string, CountryOverrides> = {
  ar: { label: 'Argentina', fallbackQuery: 'cine argentino aclamado' },
  bo: { label: 'Bolivia', fallbackQuery: 'cine boliviano recomendado' },
  br: { label: 'Brasil', fallbackQuery: 'cine brasileño recomendado' },
  ca: { label: 'Canadá', fallbackQuery: 'cine canadiense recomendado' },
  cl: { label: 'Chile', fallbackQuery: 'cine chileno aclamado' },
  co: { label: 'Colombia', fallbackQuery: 'cine colombiano destacado' },
  de: { label: 'Alemania', fallbackQuery: 'cine alemán contemporáneo' },
  dk: { label: 'Dinamarca', fallbackQuery: 'cine danés reconocido' },
  ec: { label: 'Ecuador', fallbackQuery: 'cine ecuatoriano recomendado' },
  eg: { label: 'Egipto', fallbackQuery: 'cine egipcio recomendado' },
  es: { label: 'España', fallbackQuery: 'cine español recomendado' },
  fi: { label: 'Finlandia', fallbackQuery: 'cine finlandés recomendado' },
  fr: { label: 'Francia', fallbackQuery: 'cine francés de autor' },
  gb: { label: 'Reino Unido', fallbackQuery: 'cine británico influyente' },
  gr: { label: 'Grecia', fallbackQuery: 'cine griego recomendado' },
  in: { label: 'India', fallbackQuery: 'cine indio destacado' },
  it: { label: 'Italia', fallbackQuery: 'cine italiano clásico y moderno' },
  jp: { label: 'Japón', fallbackQuery: 'cine japonés influyente' },
  kr: { label: 'Corea del Sur', fallbackQuery: 'cine coreano recomendado' },
  mx: { label: 'México', fallbackQuery: 'cine mexicano contemporáneo' },
  ng: { label: 'Nigeria', fallbackQuery: 'cine nigeriano nollywood' },
  no: { label: 'Noruega', fallbackQuery: 'cine noruego recomendado' },
  pe: { label: 'Perú', fallbackQuery: 'cine peruano recomendado' },
  pl: { label: 'Polonia', fallbackQuery: 'cine polaco recomendado' },
  pt: { label: 'Portugal', fallbackQuery: 'cine portugués recomendado' },
  se: { label: 'Suecia', fallbackQuery: 'cine sueco recomendado' },
  tr: { label: 'Turquía', fallbackQuery: 'cine turco recomendado' },
  us: { label: 'Estados Unidos', fallbackQuery: 'cine estadounidense clásico y actual' },
  uy: { label: 'Uruguay', fallbackQuery: 'cine uruguayo recomendado' },
  ve: { label: 'Venezuela', fallbackQuery: 'cine venezolano recomendado' },
  za: { label: 'Sudáfrica', fallbackQuery: 'cine sudafricano recomendado' },
};

const FEATURED_COUNTRY_IDS = ['co', 'mx', 'ar', 'cl', 'es', 'fr', 'it', 'gb', 'us', 'jp', 'kr', 'in'];

function defaultFallbackQuery(countryName: string): string {
  return `films from ${countryName}`;
}

function buildCountryCatalog(): CountryConfig[] {
  return WORLD_MAP.locations
    .map((location) => {
      const mapId = location.id.toLowerCase();
      const override = COUNTRY_OVERRIDES[mapId];

      return {
        mapId,
        countryCode: mapId.toUpperCase(),
        mapName: location.name,
        label: override?.label ?? location.name,
        fallbackQuery: override?.fallbackQuery ?? defaultFallbackQuery(location.name),
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, 'es'));
}

export const COUNTRY_CATALOG = buildCountryCatalog();

const COUNTRY_BY_MAP_ID = new Map(COUNTRY_CATALOG.map((country) => [country.mapId, country]));

export const FEATURED_COUNTRIES = FEATURED_COUNTRY_IDS
  .map((countryId) => COUNTRY_BY_MAP_ID.get(countryId))
  .filter((country): country is CountryConfig => Boolean(country));

export function getCountryByMapId(mapId: string): CountryConfig | undefined {
  return COUNTRY_BY_MAP_ID.get(mapId.toLowerCase());
}
