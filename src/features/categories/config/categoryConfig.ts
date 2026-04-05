export type CategorySlug =
  | 'terror'
  | 'romance'
  | 'drama'
  | 'policiaco'
  | 'documental'
  | 'indigena'
  | 'animadas';

type GenreDiscoveryStrategy = {
  type: 'genres';
  movieGenres: number[];
  tvGenres: number[];
  rationale: string;
};

type EditorialDiscoveryStrategy = {
  type: 'editorial';
  seedQueries: string[];
  rationale: string;
};

export type CategoryDiscoveryStrategy = GenreDiscoveryStrategy | EditorialDiscoveryStrategy;

export interface CategoryPalette {
  accentRgb: string;
  heroFrom: string;
  heroTo: string;
  ambientA: string;
  ambientB: string;
}

export interface CategoryDefinition {
  slug: CategorySlug;
  label: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  palette: CategoryPalette;
  discovery: CategoryDiscoveryStrategy;
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    slug: 'terror',
    label: 'Terror',
    description: 'Tensión psicológica, atmósferas oscuras y horror inquietante.',
    heroTitle: 'Noches de Terror',
    heroSubtitle: 'Historias que construyen suspenso desde el silencio hasta el impacto final.',
    palette: {
      accentRgb: '230, 57, 70',
      heroFrom: '#2a0c12',
      heroTo: '#120609',
      ambientA: '#5d121d',
      ambientB: '#2f0f15',
    },
    discovery: {
      type: 'genres',
      movieGenres: [27, 53, 9648],
      tvGenres: [9648, 10765, 80],
      rationale: 'Curaduría basada en horror, thriller y misterio en TMDB.',
    },
  },
  {
    slug: 'romance',
    label: 'Romance',
    description: 'Vínculos, deseo y encuentros que transforman a los personajes.',
    heroTitle: 'Cartografía del Romance',
    heroSubtitle: 'Relatos de amor, decisiones difíciles y emociones al límite.',
    palette: {
      accentRgb: '239, 120, 140',
      heroFrom: '#3a1622',
      heroTo: '#1f0f17',
      ambientA: '#6e2439',
      ambientB: '#422030',
    },
    discovery: {
      type: 'genres',
      movieGenres: [10749, 18],
      tvGenres: [10766, 18],
      rationale: 'Curaduría por drama romántico y series sentimentales.',
    },
  },
  {
    slug: 'drama',
    label: 'Drama',
    description: 'Conflictos humanos, decisiones complejas y consecuencias profundas.',
    heroTitle: 'Pulso Dramático',
    heroSubtitle: 'Personajes al borde, dilemas morales y arcos emocionales intensos.',
    palette: {
      accentRgb: '255, 166, 92',
      heroFrom: '#31211b',
      heroTo: '#1a1411',
      ambientA: '#6a3f2a',
      ambientB: '#3a2a22',
    },
    discovery: {
      type: 'genres',
      movieGenres: [18],
      tvGenres: [18],
      rationale: 'Filtro principal por género drama en catálogo movie y tv.',
    },
  },
  {
    slug: 'policiaco',
    label: 'Policíaco',
    description: 'Investigación, crimen, procedimiento y tensión urbana.',
    heroTitle: 'Archivo Policíaco',
    heroSubtitle: 'Casos, detectives y operaciones donde cada pista cambia la lectura del crimen.',
    palette: {
      accentRgb: '116, 185, 255',
      heroFrom: '#11243a',
      heroTo: '#0a1524',
      ambientA: '#1f4d7a',
      ambientB: '#17324f',
    },
    discovery: {
      type: 'genres',
      movieGenres: [80, 53, 9648],
      tvGenres: [80, 9648, 10759],
      rationale: 'Interpretación explícita: crimen + investigación + thriller en TMDB.',
    },
  },
  {
    slug: 'documental',
    label: 'Documental',
    description: 'No ficción, observación del mundo y miradas de autor.',
    heroTitle: 'Zona Documental',
    heroSubtitle: 'Historias reales, contextos históricos y piezas de investigación.',
    palette: {
      accentRgb: '80, 200, 160',
      heroFrom: '#11302a',
      heroTo: '#0b1e1a',
      ambientA: '#1f5c4f',
      ambientB: '#174036',
    },
    discovery: {
      type: 'genres',
      movieGenres: [99],
      tvGenres: [99],
      rationale: 'Curaduría directa por género documental.',
    },
  },
  {
    slug: 'indigena',
    label: 'Indígena',
    description: 'Selección editorial centrada en narrativas originarias y territorio.',
    heroTitle: 'Memoria de Pueblos Originarios',
    heroSubtitle: 'Ruta curada: se priorizan obras y búsquedas editoriales por falta de taxonomía sólida.',
    palette: {
      accentRgb: '233, 178, 87',
      heroFrom: '#2f2619',
      heroTo: '#19130c',
      ambientA: '#6f5222',
      ambientB: '#4a371d',
    },
    discovery: {
      type: 'editorial',
      seedQueries: [
        'cine indígena latinoamericano',
        'first nations film',
        'aboriginal cinema',
        'narrativas de pueblos originarios',
      ],
      rationale: 'Colección editorial por búsqueda curada, no por taxonomía fija de API.',
    },
  },
  {
    slug: 'animadas',
    label: 'Animadas',
    description: 'Animación de autor, aventuras familiares y fantasía visual.',
    heroTitle: 'Universo Animado',
    heroSubtitle: 'Del trazo artesanal al CGI contemporáneo, con foco en narrativa visual.',
    palette: {
      accentRgb: '140, 220, 255',
      heroFrom: '#142b3a',
      heroTo: '#0c1a24',
      ambientA: '#2a5c7b',
      ambientB: '#1f4057',
    },
    discovery: {
      type: 'genres',
      movieGenres: [16, 10751, 14],
      tvGenres: [16, 10762, 10765],
      rationale: 'Combinación de animación, fantasía y family-friendly.',
    },
  },
];

const CATEGORY_BY_SLUG = new Map(CATEGORY_DEFINITIONS.map((category) => [category.slug, category]));

export function getCategoryBySlug(slug: string | undefined): CategoryDefinition | undefined {
  if (!slug) {
    return undefined;
  }
  return CATEGORY_BY_SLUG.get(slug as CategorySlug);
}
