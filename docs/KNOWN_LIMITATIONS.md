# Known Limitations: The Living Archive (v1.0.0)

## 1. Storage Constraints
- **LocalStorage Limit**: The application uses `localStorage` for "The Vault". Most browsers limit this to ~5MB. Storing hundreds of movies with full metadata might eventually hit this limit.
- **No Cloud Sync**: Since this is a "Local-First" MVP, your archive is tied to your browser and device. Clearing browser data will erase your vault unless you have exported it to JSON.

## 2. API & Intelligence
- **Gemini Context Window**: While Gemini has a massive context window, the current "Discovery" prompt sends a curated list of your archive to avoid duplicates. If your archive grows to thousands of movies, we may need to implement a more advanced filtering strategy (e.g., Vector Search/Embeddings).
- **TMDB Metadata**: Poster availability and localized titles depend on TMDB's database. Some obscure or very recent films might lack high-quality artwork.
- **Wikipedia History**: The "Historical Resonance" feature depends on Wikipedia's "On This Day" API. If the API is down, the app falls back to a generic "Cinematic Era" discovery mode.

## 3. Visuals & Performance
- **Color Extraction**: Extracting vibrant colors from posters is a CPU-intensive task. We use downsampled images to mitigate this, but low-end devices might experience slight stutters when loading many new recommendations at once.
- **Noir Mode**: The grayscale filter is a CSS-level effect (`backdrop-filter` or `filter`). It may impact scroll performance on older mobile devices.

## 4. Security
- **BYOK**: The `GEMINI_API_KEY` is stored in the browser's session/local state if provided via UI. While convenient, users should be aware that anyone with access to their device could potentially retrieve the key.
