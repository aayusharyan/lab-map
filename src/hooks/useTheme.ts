/**
 * @file useTheme.ts
 * @description Hook for dark/light/system theme management
 *
 * This hook manages the application's color theme preference.
 * It resolves the selected preference to an actual light/dark theme,
 * synchronizes that value with the DOM, and exposes a convenient toggle.
 *
 * Hook Type: Derived (wraps useSettings)
 * This hook calls useSettingsOrThrow() internally, which is a context-based hook.
 * It requires the component tree to be wrapped in SettingsProvider.
 *
 * Error Handling:
 * This hook inherits error-throwing behavior from useSettingsOrThrow(). If used
 * outside of SettingsProvider, useSettingsOrThrow() will throw an error. This
 * catches setup mistakes early during development.
 *
 * How it works:
 * 1. Reads the current theme preference from SettingsContext
 * 2. Resolves `system` using `prefers-color-scheme`
 * 3. Syncs the resolved theme to the document via `data-theme`
 * 4. Lets SettingsContext handle persistence via localStorage
 *
 * Important type distinction:
 * - `theme` is `ThemeId` (`dark | light | system`) and represents user intent.
 * - `resolvedTheme` is `ResolvedTheme` (`dark | light`) and represents the
 *   concrete value used by rendering and CSS.
 *
 * Theme Application:
 * The hook sets `data-theme="dark"` or `data-theme="light"` on the
 * document root element (<html>). CSS custom properties respond to this
 * attribute to apply the appropriate color scheme.
 *
 * @example
 * function ThemeToggle() {
 *   const { theme, resolvedTheme, toggleTheme } = useTheme();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current: {theme} ({resolvedTheme})
 *     </button>
 *   );
 * }
 *
 * @see style.css - Theme CSS variables
 * @see SettingsContext.tsx - Theme persistence
 * @see useSettings.ts - Base context hook (provides error handling)
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useEffect, useState } from 'react';

import { useSettingsOrThrow } from '@/hooks/useSettings';
import { getSystemTheme, resolveTheme, type ThemeId, type ResolvedTheme } from '@/utils/theme';

/* ============================================================================
 * HOOK IMPLEMENTATION
 * ============================================================================ */

/**
 * Hook for managing dark/light/system theme preferences.
 *
 * Returns the current theme preference, the resolved theme, and a function to
 * cycle between theme preferences. Automatically syncs theme changes to the DOM.
 * Persistence is handled by SettingsContext.
 *
 * @returns {object} Theme state and controls
 * @returns {ThemeId} theme - Current saved preference (can be `system`)
 * @returns {ResolvedTheme} resolvedTheme - Concrete runtime theme (`dark` or `light`)
 */
export function useTheme() {
  const { state, dispatch } = useSettingsOrThrow();
  const { theme } = state.settings;
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  /**
   * Track OS color-scheme changes so `system` mode stays live.
   */
  useEffect(() => {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const resolvedTheme: ResolvedTheme = resolveTheme(theme, systemTheme);

  /**
   * Sync the resolved theme to the document root element.
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);


  return {
    /** Current theme preference */
    theme,

    /** Current resolved theme ('dark' or 'light') */
    resolvedTheme,
  };
}
