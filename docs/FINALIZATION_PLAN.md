# Finalization Plan - The Living Archive

This document outlines the roadmap to close the MVP for "The Living Archive".

## Phase 1: Cleanup & Consolidation (P0)
**Goal:** Remove technical debt and obsolete code to ensure a clean build.

- [ ] **Delete Obsolete Files:**
  - `google-apps-script/` directory.
  - `src/services/inferenceEngine.ts` (Redundant logic).
- [ ] **Documentation:**
  - Create `README.md` with setup instructions (BYOK Gemini, TMDB Key).
  - Update `metadata.json` description.
- [ ] **Environment Alignment:**
  - Ensure `.env.example` only contains necessary variables (GEMINI, TMDB).

## Phase 2: Robustness & UX Refinement (P1)
**Goal:** Improve error handling and user guidance.

- [ ] **Error Boundaries:** Implement more resilient error handling for external API failures (TMDB/Wikipedia).
- [ ] **User Feedback:** Add a clear "How it works" section or modal.
- [ ] **Schema Sync:** Ensure `CachedMovie` and `Movie` types are perfectly aligned across all services.

## Phase 3: Polish & Performance (P2)
**Goal:** Visual and performance optimizations.

- [ ] **Color Extraction Optimization:** Debounce or memoize the color extraction from posters.
- [ ] **Noir Mode Persistence:** Save Noir Mode preference in `localStorage`.
- [ ] **Transitions:** Refine Framer Motion entrances for a more "astral" feel.

## Release Criteria
1. `npm run lint` passes without errors.
2. `npm run build` generates a production-ready `dist/` folder.
3. Full discovery-to-archive flow verified manually.
