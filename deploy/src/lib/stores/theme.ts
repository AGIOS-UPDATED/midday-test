'use client'; // Allows usage of browser APIs in Next.js App Router

import { atom } from 'nanostores';
import { logStore } from './logs';

export type Theme = 'dark' | 'light';

export const kTheme = 'bolt_theme';
export const DEFAULT_THEME = 'light';

/**
 * Nanostores Atom for theme
 */
export const themeStore = atom<Theme>(initTheme());

function initTheme(): Theme {
  // Only read localStorage and document when on the client
  if (typeof window !== 'undefined') {
    const persistedTheme = localStorage.getItem(kTheme) as Theme | undefined;
    const themeAttribute = document.querySelector('html')?.getAttribute('data-theme');

    return persistedTheme ?? (themeAttribute as Theme) ?? DEFAULT_THEME;
  }

  // Server default or fallback
  return DEFAULT_THEME;
}

/**
 * Checks if the current theme is dark
 */
export function themeIsDark(): boolean {
  return themeStore.get() === 'dark';
}

/**
 * Toggles the theme between dark/light
 */
export function toggleTheme() {
  const currentTheme = themeStore.get();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // Update the Nanostores atom
  themeStore.set(newTheme);

  // Log the theme change
  logStore.logSystem(`Theme changed to ${newTheme} mode`);

  // Update localStorage and <html> attribute in the browser
  if (typeof window !== 'undefined') {
    localStorage.setItem(kTheme, newTheme);
    document.querySelector('html')?.setAttribute('data-theme', newTheme);
  }
}
