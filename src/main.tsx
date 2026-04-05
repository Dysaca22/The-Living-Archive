import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './features/theme/ThemeContext';
import { GeminiProvider } from './features/ai/GeminiProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GeminiProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </GeminiProvider>
  </StrictMode>,
);
