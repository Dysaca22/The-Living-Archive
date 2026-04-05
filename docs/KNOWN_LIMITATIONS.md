# Limitaciones Conocidas MVP (v1.0)

## Persistencia
- La boveda usa `localStorage` del navegador.
- No hay sincronizacion entre dispositivos o navegadores.
- Si se borra el storage del navegador y no hay exportacion previa, los datos se pierden.
- El limite practico de almacenamiento depende del navegador (usualmente ~5MB).

## Fuentes externas
- La calidad de posters, ratings, reviews y metadatos depende de TMDB.
- Algunas obras tienen metadatos incompletos (sin poster, sin reviews, sin collection, sin temporadas completas).
- La seccion "En este dia de la historia" depende de Wikipedia On This Day; si falla, puede degradar a estado vacio o mensaje de error.

## Descubrimiento asistido
- El flujo por frases/escenas depende de Gemini y puede devolver ambiguedad o baja confianza.
- Cuando Gemini no entrega `tmdbId`, se usa fallback por busqueda textual en TMDB; puede fallar en titulos ambiguos.
- La categoria `indigena` se resuelve con estrategia editorial (no taxonomia oficial unica).
- La categoria `policiaco` es una interpretacion explicita basada en combinacion de generos.

## UX y performance
- El theming dinamico depende de imagen disponible; sin imagen se aplica fallback.
- En cargas de red lentas algunas secciones pueden tardar en hidratar resultados por separado.
- El build puede reportar warning de chunk grande; no bloquea release, pero conviene optimizar split de bundles en post-MVP.

## Seguridad y llaves
- En modo BYOK, la clave de Gemini queda en storage local del navegador del usuario.
- Cualquier persona con acceso al mismo perfil del navegador podria leer esa clave.
