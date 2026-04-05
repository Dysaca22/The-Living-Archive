# Checklist de Release MVP

## Entorno
- [ ] `TMDB_READ_ACCESS_TOKEN` configurado en entorno.
- [ ] `GEMINI_API_KEY` configurada en entorno o cargable desde UI.
- [ ] `.env.example` alineado con variables reales.

## Calidad tecnica
- [ ] `npm run lint` en verde.
- [ ] `npm run build` en verde.
- [ ] Sin errores de TypeScript.
- [ ] Warnings de build revisados y aceptados para MVP.

## Flujo funcional
- [ ] Home renderiza las 4 secciones con estados de `loading`, `empty` y `error`.
- [ ] `/buscar` opera en modo frases/escenas y modo descubrimiento general.
- [ ] `/paises` permite seleccionar pais, limpiar seleccion y abrir detalle.
- [ ] `/categoria/:slug` funciona para las 7 categorias configuradas.
- [ ] El detalle soporta `movie` y `tv`, reviews, temporadas y colecciones cuando existan.
- [ ] El registro personal (guardar, eliminar, estado, rating, notas) funciona desde rutas clave.

## Persistencia local
- [ ] Migracion de estados legacy (`pending`, `watched`, `archived`) a (`no_visto`, `en_proceso`, `visto`) validada.
- [ ] Deduplicacion unificada validada (`tmdbId` o `title+year+mediaType`).
- [ ] Exportacion e importacion JSON operativas.

## UX minima de release
- [ ] Copy visible principal en espanol.
- [ ] Controles interactivos clave con foco visible y labels accesibles.
- [ ] Mensajes de error entendibles para usuario final.

## Documentacion
- [ ] `README.md` refleja el producto real.
- [ ] `docs/KNOWN_LIMITATIONS.md` actualizado.
- [ ] Cualquier plan post-MVP marcado como no vigente para release actual.
