# Plan de Persistencia Remota (Post-MVP)

## Estado
Archivado para la release MVP actual.

## Contexto
La arquitectura congelada del MVP usa persistencia local en `localStorage`.
No hay dual-write ni backend remoto activo para la boveda en esta version.

## Decision para release actual
- Mantener solo persistencia local.
- Mantener `server.ts` exclusivamente para proxy TMDB.
- No agregar endpoints `/api/vault` ni integraciones con Google Sheets.

## Si se retoma en post-MVP
- Evaluar autenticacion y modelo de usuario antes de persistencia remota.
- Definir estrategia de conflicto/sincronizacion multi-dispositivo.
- Implementar capa remota desacoplada de la UI para no romper el flujo local-first.
