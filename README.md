# The Living Archive

Producto MVP para descubrimiento de cine y series con enfoque local-first.

## Alcance MVP
- Persistencia oficial en `localStorage` (boveda local).
- BYOK para Gemini (clave del usuario).
- TMDB consumido por proxy interno en `server.ts`.
- Sin persistencia remota activa en el MVP.

## Rutas principales
- `/`: Home con Tendencia, Filmes de esta epoca del ano, En este dia de la historia y Recomendado para ti.
- `/buscar`: modulo dedicado para busqueda por frases/escenas y descubrimiento general.
- `/paises`: mapa del mundo clicable con descubrimiento por pais.
- `/categoria/:slug`: rutas inmersivas tematicas (`terror`, `romance`, `drama`, `policiaco`, `documental`, `indigena`, `animadas`).
- `/vault`: boveda personal (estado, rating personal, notas, import/export).

## Stack tecnico
- React 19 + TypeScript + Vite.
- `react-router-dom` para routing.
- Tailwind CSS 4 para estilos.
- `@google/genai` para recomendaciones asistidas.
- TMDB + Wikipedia como fuentes externas.

## Variables de entorno
Crear `.env` (o usar secrets del entorno) con:

```env
TMDB_READ_ACCESS_TOKEN="TU_TOKEN_TMDB"
GEMINI_API_KEY="TU_API_KEY_GEMINI" # opcional, tambien se puede cargar desde UI
```

## Desarrollo
```bash
npm install
npm run dev
```

Servidor local: `http://localhost:3000`

## Calidad
```bash
npm run lint
npm run build
```

## Documentacion complementaria
- [Decisiones de arquitectura](./docs/ARCHITECTURE_DECISION.md)
- [Limitaciones conocidas MVP](./docs/KNOWN_LIMITATIONS.md)
- [Checklist de release](./docs/RELEASE_CHECKLIST.md)
- [Plan remoto (post-MVP)](./docs/REMOTE_PERSISTENCE_PLAN.md)
