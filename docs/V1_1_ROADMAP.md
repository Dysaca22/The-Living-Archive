# Roadmap: The Living Archive v1.1

## 1. Intelligence & Personalization
- **Vector Search (RAG)**: Implement local vector storage (e.g., using `voy-search` or similar) to allow the "Astral Curator" to search through thousands of archived movies more efficiently.
- **Mood-Based Discovery**: Add a "Mood Selector" (e.g., Melancholic, Ethereal, Brutalist) to further refine the Gemini prompt.
- **Director/Actor Deep Dives**: Allow users to "follow" a cinematic resonance to discover more works by the same creators.

## 2. Visuals & UX
- **Dynamic Theming**: Automatically adjust the app's accent colors based on the currently selected movie's poster (using `extract-colors` more deeply).
- **Interactive Timeline**: A visual timeline in "The Vault" showing the chronological distribution of the archived cinematic history.
- **Custom Auras**: Allow users to customize the ambient background auras.

## 3. Connectivity
- **Watchlist Sync**: Optional integration with Letterboxd or Trakt.tv.
- **Social Sharing**: Generate "Astral Archive Cards" (images) for sharing recommendations on social media.
- **PWA Support**: Full offline support and "Add to Home Screen" functionality for a native-like experience.

## 4. Technical Debt & Optimization
- **IndexedDB**: Migrate from `localStorage` to `IndexedDB` for virtually unlimited storage capacity.
- **Unit Testing**: Implement a robust test suite for the "Presentation Controller" and "Platform State Manager" logic.
- **Image Proxy**: Implement a small serverless function to proxy TMDB images and avoid `referrerPolicy` issues on some browsers.
