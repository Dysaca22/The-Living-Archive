# Architecture Decision Record - The Living Archive

## Status
Accepted (2026-04-03)

## Context
The project initially considered a Google Sheets backend for persistence. However, current implementation has moved towards a "Local-First" approach using browser `localStorage`. There is a need to freeze the architecture for the MVP release.

## Decision
We will proceed with a **Local-First, BYOK (Bring Your Own Key)** architecture.

### Key Components:
1. **Intelligence**: Google Gemini 2.5 Flash via `@google/genai`. Users provide their own API Key.
2. **Persistence**: Browser `localStorage` via `LocalCacheService`.
3. **Metadata Enrichment**: 
   - **Visuals**: The Movie Database (TMDB) API.
   - **History**: Wikipedia "On This Day" REST API.
4. **Orchestration**: `PresentationController` acts as the single source of truth for the UI data contract.

### Rationale:
- **Zero Latency**: Local storage provides instant feedback for archiving.
- **Privacy**: User data and API keys stay on the device.
- **Complexity Reduction**: Eliminates the need for Google Apps Script proxies and CORS management for the database layer.
- **Cost**: Zero infrastructure cost for the deployer.

## Consequences
- Users cannot sync their archive across different browsers/devices in this MVP.
- Data is lost if the user clears their browser cache.
- Google Sheets integration is postponed for a post-MVP "Cloud Sync" feature.

## Obsolete Patterns (Removed)
- References to `VITE_GOOGLE_SHEETS_WEB_APP_URL` were removed from runtime config.
- `google-apps-script/` is no longer part of the MVP path.
- The redundant inference layer was replaced by the current prompt/service flow.
