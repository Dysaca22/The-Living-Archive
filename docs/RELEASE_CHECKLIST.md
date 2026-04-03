# Release Checklist: The Living Archive (v1.0.0)

## 1. Environment Configuration
- [ ] `VITE_TMDB_API_KEY` is set in the environment (AI Studio Secrets).
- [ ] `GEMINI_API_KEY` is either set in the environment or the user is prompted in the UI.
- [ ] `.env.example` is up to date with all required variables.

## 2. Dependencies & Build
- [ ] `npm install` runs without errors.
- [ ] `npm run lint` (tsc) passes without errors.
- [ ] `npm run build` generates a production-ready `dist/` folder.
- [ ] Unused dependencies (`express`, `tsx`, `dotenv`) have been removed from `package.json`.

## 3. Core Functionality (Local-First)
- [ ] **Discovery**: Gemini recommendations are generated and enriched with TMDB posters.
- [ ] **The Vault**: Movies can be saved to `localStorage`.
- [ ] **Deduplication**: Saving the same movie twice is prevented (TMDB ID or Title+Year).
- [ ] **Archive Management**: Movies can be deleted from the vault.
- [ ] **Export/Import**: The vault can be exported to JSON and imported back.
- [ ] **Noir Mode**: Visual filter works across all views.

## 4. UI/UX & Design System
- [ ] **Glassmorphism**: All cards and panels use the glass effect.
- [ ] **Typography**: Serif (Editorial) and Mono (Technical) fonts are correctly applied.
- [ ] **Responsive**: Layout works on mobile and desktop.
- [ ] **Empty States**: "Discover" and "Vault" have elegant empty states.
- [ ] **Error Handling**: API failures (Gemini/TMDB) show user-friendly messages.

## 5. Performance
- [ ] Poster color extraction is optimized (downscaled pixels).
- [ ] Images use `referrerPolicy="no-referrer"`.
- [ ] `motion` animations are fluid and purposeful.

## 6. Documentation
- [ ] `README.md` explains the BYOK and local-first architecture.
- [ ] `docs/KNOWN_LIMITATIONS.md` is populated.
- [ ] Code comments explain the "Astral Flow" and "Presentation Controller" patterns.
