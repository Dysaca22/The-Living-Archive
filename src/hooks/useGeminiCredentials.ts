import { useContext } from 'react';
import { GeminiContext } from '../features/ai/GeminiProvider';

export function useGeminiCredentials() {
  const context = useContext(GeminiContext);

  if (!context) {
    throw new Error('useGeminiCredentials debe usarse dentro de GeminiProvider.');
  }

  return context;
}
