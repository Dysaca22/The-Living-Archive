export interface SeasonalSignals {
  cacheKey: string;
  dayKey: string;
  month: number;
  monthLabel: string;
  sectionTitle: string;
  sectionSubtitle: string;
  culturalMoments: string[];
  thematicPillars: string[];
  editorialQueries: string[];
  movieGenreIds: number[];
  tvGenreIds: number[];
}

interface MonthBlueprint {
  titleLabel: string;
  subtitle: string;
  culturalMoments: string[];
  themes: string[];
  editorialQueries: string[];
  movieGenreIds: number[];
  tvGenreIds: number[];
}

interface DynamicMoment {
  label: string;
  themes: string[];
  editorialQueries: string[];
  movieGenreIds: number[];
  tvGenreIds: number[];
}

const MONTH_LABELS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const MONTH_BLUEPRINTS: Record<number, MonthBlueprint> = {
  1: {
    titleLabel: 'Enero en clave de reinicio',
    subtitle: 'Año nuevo con historias de propósito, viaje y vínculos cercanos.',
    culturalMoments: ['Año nuevo', 'temporada vacacional'],
    themes: ['reinicio', 'aventura', 'familia', 'viajes'],
    editorialQueries: ['películas de viaje inspiradoras', 'series familiares para vacaciones', 'cine de aventura clásico'],
    movieGenreIds: [12, 35, 10751, 18],
    tvGenreIds: [35, 10759, 18, 10765],
  },
  2: {
    titleLabel: 'Febrero emocional',
    subtitle: 'Romance, comedia y dramas íntimos para un mes de conexiones.',
    culturalMoments: ['San Valentín', 'temporada de premios'],
    themes: ['romance', 'vínculos', 'nostalgia', 'encuentros'],
    editorialQueries: ['películas románticas recomendadas', 'series románticas destacadas', 'dramas sentimentales cine'],
    movieGenreIds: [10749, 35, 18, 10402],
    tvGenreIds: [10766, 35, 18, 9648],
  },
  3: {
    titleLabel: 'Marzo de transición',
    subtitle: 'Relatos de cambio, decisiones y nuevos rumbos.',
    culturalMoments: ['inicio de temporada', 'agenda cultural de marzo'],
    themes: ['transición', 'identidad', 'crecimiento', 'cambio'],
    editorialQueries: ['cine de crecimiento personal', 'series sobre cambios de vida', 'películas de decisión y destino'],
    movieGenreIds: [18, 9648, 36, 10749],
    tvGenreIds: [18, 9648, 99, 10766],
  },
  4: {
    titleLabel: 'Abril contemplativo',
    subtitle: 'Curaduría para un periodo de introspección y ritual cultural.',
    culturalMoments: ['Semana Santa', 'festivales de otoño/primavera'],
    themes: ['fe', 'redención', 'duelo', 'esperanza', 'familia'],
    editorialQueries: ['películas sobre fe y redención', 'cine espiritual contemporáneo', 'series históricas de época religiosa'],
    movieGenreIds: [18, 36, 99, 10752, 10751],
    tvGenreIds: [18, 99, 9648, 10768, 10765],
  },
  5: {
    titleLabel: 'Mayo íntimo',
    subtitle: 'Historias de familia, memoria y transformación personal.',
    culturalMoments: ['mes de la familia', 'temporada de cierre académico'],
    themes: ['familia', 'memoria', 'madurez', 'reconciliación'],
    editorialQueries: ['películas sobre familia y reconciliación', 'dramas familiares recomendados', 'series de crecimiento y legado'],
    movieGenreIds: [18, 10751, 36, 35],
    tvGenreIds: [18, 35, 10766, 99],
  },
  6: {
    titleLabel: 'Junio de alto contraste',
    subtitle: 'Acción, thriller y ciencia ficción para una temporada intensa.',
    culturalMoments: ['mitad de año', 'temporada blockbuster'],
    themes: ['adrenalina', 'futuro', 'riesgo', 'supervivencia'],
    editorialQueries: ['blockbusters de ciencia ficción', 'thrillers de alta tensión', 'series de acción recomendadas'],
    movieGenreIds: [28, 878, 53, 12],
    tvGenreIds: [10759, 10765, 9648, 80],
  },
  7: {
    titleLabel: 'Julio de aventura',
    subtitle: 'Ritmo alto, épica y entretenimiento de verano/invierno.',
    culturalMoments: ['vacaciones de mitad de año', 'estrenos comerciales'],
    themes: ['aventura', 'épica', 'grupo', 'viaje'],
    editorialQueries: ['películas épicas de aventura', 'franquicias de acción y fantasía', 'series de aventura moderna'],
    movieGenreIds: [12, 28, 14, 53],
    tvGenreIds: [10759, 10765, 18, 9648],
  },
  8: {
    titleLabel: 'Agosto de tensión',
    subtitle: 'Misterio, crimen y fantasía oscura para cerrar temporada.',
    culturalMoments: ['cierre de vacaciones', 'retorno a rutina'],
    themes: ['misterio', 'suspenso', 'investigación', 'oscuridad'],
    editorialQueries: ['películas de suspenso recomendadas', 'series de misterio y crimen', 'thrillers psicológicos cine'],
    movieGenreIds: [53, 9648, 80, 14],
    tvGenreIds: [9648, 80, 10759, 18],
  },
  9: {
    titleLabel: 'Septiembre de reinicio',
    subtitle: 'Nuevos ciclos con cine de búsqueda y propósito.',
    culturalMoments: ['retorno de agenda', 'temporada de festivales'],
    themes: ['nuevo comienzo', 'aprendizaje', 'identidad', 'destino'],
    editorialQueries: ['películas sobre nuevos comienzos', 'dramas de identidad recomendados', 'series de reinicio de vida'],
    movieGenreIds: [18, 9648, 99, 36],
    tvGenreIds: [18, 99, 9648, 10766],
  },
  10: {
    titleLabel: 'Octubre inquietante',
    subtitle: 'Mes ideal para terror, suspenso y relatos de atmósfera.',
    culturalMoments: ['Halloween', 'temporada de terror'],
    themes: ['miedo', 'suspenso', 'lo desconocido', 'rituales'],
    editorialQueries: ['películas de terror recomendadas', 'series de horror y misterio', 'thrillers sobrenaturales'],
    movieGenreIds: [27, 53, 9648, 14],
    tvGenreIds: [9648, 80, 18, 10765],
  },
  11: {
    titleLabel: 'Noviembre de cierre',
    subtitle: 'Curaduría reflexiva entre drama histórico y documental.',
    culturalMoments: ['fin de año cercano', 'temporada de balances'],
    themes: ['balance', 'historia', 'legado', 'impacto social'],
    editorialQueries: ['películas históricas recomendadas', 'documentales sociales destacados', 'series de drama histórico'],
    movieGenreIds: [18, 36, 99, 10752],
    tvGenreIds: [18, 99, 80, 10768],
  },
  12: {
    titleLabel: 'Diciembre festivo',
    subtitle: 'Selección cálida para celebrar, compartir y cerrar el año.',
    culturalMoments: ['Navidad', 'fin de año'],
    themes: ['celebración', 'familia', 'nostalgia', 'esperanza'],
    editorialQueries: ['películas familiares navidad', 'comedias para fin de año', 'series feel-good recomendadas'],
    movieGenreIds: [10751, 35, 18, 12],
    tvGenreIds: [10766, 35, 10759, 18],
  },
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function mergeUniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = normalizeToken(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    output.push(value);
  }

  return output;
}

function mergeUniqueNumbers(values: number[]): number[] {
  const seen = new Set<number>();
  const output: number[] = [];

  for (const value of values) {
    if (!Number.isFinite(value) || seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }

  return output;
}

function getEasterSundayUtc(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toUtcDayValue(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isWithinUtcRange(target: Date, start: Date, end: Date): boolean {
  const targetValue = toUtcDayValue(target);
  return targetValue >= toUtcDayValue(start) && targetValue <= toUtcDayValue(end);
}

function getDynamicMoments(date: Date): DynamicMoment[] {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const moments: DynamicMoment[] = [];

  const easterSunday = getEasterSundayUtc(year);
  const palmSunday = addUtcDays(easterSunday, -7);
  if (isWithinUtcRange(date, palmSunday, easterSunday)) {
    moments.push({
      label: 'Semana Santa',
      themes: ['fe', 'redención', 'sacrificio', 'tradición'],
      editorialQueries: [
        'películas de semana santa',
        'cine bíblico recomendado',
        'series históricas religiosas',
      ],
      movieGenreIds: [18, 36, 99, 10752],
      tvGenreIds: [18, 99, 10768],
    });
  }

  if (month === 10) {
    moments.push({
      label: 'Temporada Halloween',
      themes: ['horror', 'folklore', 'misterio', 'suspenso'],
      editorialQueries: ['películas clásicas de halloween', 'terror sobrenatural recomendado'],
      movieGenreIds: [27, 53, 14],
      tvGenreIds: [9648, 10765, 80],
    });
  }

  if (month === 12) {
    moments.push({
      label: 'Fiestas de fin de año',
      themes: ['encuentro', 'celebración', 'nostalgia', 'familia'],
      editorialQueries: ['películas navideñas clásicas', 'series para maratonear en navidad'],
      movieGenreIds: [10751, 35, 18],
      tvGenreIds: [10766, 35, 18],
    });
  }

  return moments;
}

function buildMomentSuffix(culturalMoments: string[]): string {
  if (culturalMoments.length === 0) {
    return '';
  }
  return culturalMoments.join(' + ');
}

export function getSeasonalSignals(date = new Date()): SeasonalSignals {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const monthLabel = MONTH_LABELS[month - 1] ?? MONTH_LABELS[0];
  const blueprint = MONTH_BLUEPRINTS[month] ?? MONTH_BLUEPRINTS[1];
  const dynamicMoments = getDynamicMoments(date);

  const culturalMoments = mergeUniqueStrings([
    ...blueprint.culturalMoments,
    ...dynamicMoments.map((moment) => moment.label),
  ]);
  const thematicPillars = mergeUniqueStrings([
    ...blueprint.themes,
    ...dynamicMoments.flatMap((moment) => moment.themes),
  ]);
  const editorialQueries = mergeUniqueStrings([
    ...blueprint.editorialQueries,
    ...dynamicMoments.flatMap((moment) => moment.editorialQueries),
  ]);
  const movieGenreIds = mergeUniqueNumbers([
    ...blueprint.movieGenreIds,
    ...dynamicMoments.flatMap((moment) => moment.movieGenreIds),
  ]);
  const tvGenreIds = mergeUniqueNumbers([
    ...blueprint.tvGenreIds,
    ...dynamicMoments.flatMap((moment) => moment.tvGenreIds),
  ]);

  const momentSuffix = buildMomentSuffix(culturalMoments.slice(0, 2));
  const sectionSubtitle = [
    `${blueprint.subtitle}`,
    momentSuffix ? `Momento: ${momentSuffix}.` : '',
    thematicPillars.length > 0 ? `Temas: ${thematicPillars.slice(0, 5).join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const momentCacheTag = dynamicMoments.length > 0
    ? dynamicMoments.map((moment) => normalizeToken(moment.label).replace(/\s+/g, '-')).join('+')
    : 'base';

  return {
    cacheKey: `${year}-${pad(month)}-${momentCacheTag}`,
    dayKey: `${year}-${pad(month)}-${pad(day)}`,
    month,
    monthLabel,
    sectionTitle: `Filmes de esta época del año`,
    sectionSubtitle,
    culturalMoments,
    thematicPillars,
    editorialQueries,
    movieGenreIds,
    tvGenreIds,
  };
}

