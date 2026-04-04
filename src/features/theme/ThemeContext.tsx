import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { extractColors } from 'extract-colors';
import { MediaDetail, Movie } from '../../types/movie';

const DEFAULT_THEME_RGB = '255, 77, 0';

interface ThemeContextValue {
  themeRgb: string;
  applyThemeFromImage: (imageUrl?: string | null) => Promise<void>;
  applyThemeFromMedia: (movie: Movie, detail?: MediaDetail | null) => Promise<void>;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function toRgbString(red: number, green: number, blue: number): string {
  return `${Math.max(0, Math.min(255, Math.round(red)))}, ${Math.max(0, Math.min(255, Math.round(green)))}, ${Math.max(
    0,
    Math.min(255, Math.round(blue))
  )}`;
}

function pickThemeImage(movie: Movie, detail?: MediaDetail | null): string | undefined {
  return detail?.backdropUrl || detail?.posterUrl || movie.backdropUrl || movie.posterUrl;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeRgb, setThemeRgb] = useState(DEFAULT_THEME_RGB);
  const colorCacheRef = useRef(new Map<string, string>());
  const requestIdRef = useRef(0);

  useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-theme-rgb', themeRgb);
  }, [themeRgb]);

  const applyThemeFromImage = useCallback(async (imageUrl?: string | null) => {
    const normalizedUrl = imageUrl?.trim();
    if (!normalizedUrl) {
      setThemeRgb(DEFAULT_THEME_RGB);
      return;
    }

    const fromCache = colorCacheRef.current.get(normalizedUrl);
    if (fromCache) {
      setThemeRgb(fromCache);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const colors = await extractColors(normalizedUrl, {
        crossOrigin: 'anonymous',
        pixels: 6000,
        distance: 0.22,
      });

      const selectedColor = colors[0];
      if (!selectedColor) {
        return;
      }

      if (requestIdRef.current !== requestId) {
        return;
      }

      const rgb = toRgbString(selectedColor.red, selectedColor.green, selectedColor.blue);
      colorCacheRef.current.set(normalizedUrl, rgb);
      setThemeRgb(rgb);
    } catch (error) {
      console.error('Failed to extract dynamic theme color:', error);
      if (requestIdRef.current === requestId) {
        setThemeRgb(DEFAULT_THEME_RGB);
      }
    }
  }, []);

  const applyThemeFromMedia = useCallback(async (movie: Movie, detail?: MediaDetail | null) => {
    const imageUrl = pickThemeImage(movie, detail);
    await applyThemeFromImage(imageUrl);
  }, [applyThemeFromImage]);

  const resetTheme = useCallback(() => {
    requestIdRef.current += 1;
    setThemeRgb(DEFAULT_THEME_RGB);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeRgb,
      applyThemeFromImage,
      applyThemeFromMedia,
      resetTheme,
    }),
    [applyThemeFromImage, applyThemeFromMedia, resetTheme, themeRgb]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeController() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeController must be used within ThemeProvider.');
  }
  return context;
}
