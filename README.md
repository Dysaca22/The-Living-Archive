# The Living Archive

A sentient repository of cinematic history powered by Gemini AI and a Local-First BYOK architecture.

## Features
- **Cinematic Discovery**: Personalized movie recommendations using Gemini 2.5 Flash.
- **Historical Resonance**: Daily context from Wikipedia "On This Day" to inspire discovery.
- **The Vault**: Local-first archive to persist your cinematic resonances using `localStorage`.
- **Noir Mode**: A high-contrast, grayscale visual filter for an immersive experience.
- **BYOK (Bring Your Own Key)**: Full control over your Gemini and TMDB API keys.
- **Export/Import**: Portability for your cinematic archive via JSON files.

## Setup
1. **Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/).
2. **TMDB Access**: Obtain an **API Read Access Token** from [The Movie Database](https://www.themoviedb.org/documentation/api).
3. **Environment Variables**:
   - Create a `.env` file (or use the AI Studio secrets).
   - Set `TMDB_READ_ACCESS_TOKEN` with your TMDB token.
   - (Optional) `GEMINI_API_KEY` can be set in the environment or provided via the UI.

## Architecture
- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion.
- **Intelligence**: Google Gemini 2.5 Flash (Structured Outputs).
- **Persistence**: Browser `localStorage` (Autonomous & Decentralized).
- **APIs**: Wikipedia (History), TMDB (Posters).

## Development
```bash
npm install
npm run dev
```

## License
MIT
