/**
 * @file theme.ts
 * @description Canonical theme registry and runtime resolution helpers
 *
 * This module provides the core runtime logic for converting user theme
 * preferences into concrete theme values used by rendering and styling code.
 *
 * Exports:
 * - THEMES: Canonical theme registry keyed by theme ID
 * - THEME_IDS: Canonical list of all registry keys
 * - ThemeId: Union of canonical theme IDs
 * - ResolvedTheme: Concrete runtime theme (`dark | light`)
 * - isThemeId: Type guard for validating unknown theme values
 * - getThemeOrThrow: Resolve a raw key and throw on unknown type
 * - getSystemTheme: Browser/OS color-scheme resolver with SSR-safe fallback
 * - resolveTheme: Bridge from persisted `ThemeId` to concrete `ResolvedTheme`
 *
 * Theme model:
 * - `ThemeId` represents persisted user preference (`dark | light | system`)
 * - `ResolvedTheme` is concrete runtime theme (`dark | light`)
 *
 * @see edgeType.ts - Theme-aware edge color resolution
 * @see nodeType.ts - Theme-aware node color resolution
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import type { Theme, ThemeId, ResolvedTheme } from './theme.types';

const defineThemes = <T extends Record<ThemeId, Theme>>(themes: T) => themes;

/* ============================================================================
 * THEME REGISTRY
 * ============================================================================ */

/**
 * Canonical theme registry keyed by theme ID.
 */
const THEMES_MAP = defineThemes({
  dark: { id: 'dark', label: 'Dark' },
  light: { id: 'light', label: 'Light' },
  system: { id: 'system', label: 'System Defined' },
});

/**
 * Canonical theme IDs and registry exports.
 */
export const THEMES: Record<ThemeId, Theme> = THEMES_MAP;
export const THEME_IDS = Object.keys(THEMES_MAP) as ThemeId[];

/* ============================================================================
 * TYPE GUARDS
 * ============================================================================ */

/**
 * Type guard for validating `ThemeId` values.
 *
 * Use this at data boundaries where theme values arrive as untyped strings
 * (for example URL params, storage payloads, or external JSON input).
 *
 * @param {string} value - Raw value to validate
 * @returns {boolean} True when value is a canonical ThemeId
 */
export function isThemeId(value: string): value is ThemeId {
  return Object.prototype.hasOwnProperty.call(THEMES_MAP, value);
}

/**
 * Resolve a raw theme key and throw when the type is unknown.
 *
 * @param {string | undefined} type - Raw theme key
 * @returns {Theme} Canonical theme metadata
 */
export function getThemeOrThrow(type: string | undefined): Theme {
  const resolved = type && isThemeId(type) ? THEMES[type] : undefined;
  if (!resolved) {
    throw new Error(`Unknown theme type: "${type ?? '(missing)'}"`);
  }
  return resolved;
}

/* ============================================================================
 * THEME RESOLUTION HELPERS
 * ============================================================================ */

/**
 * Resolve the current system color-scheme preference.
 *
 * Behavior:
 * - Returns `dark` when `prefers-color-scheme: dark` currently matches
 * - Returns `light` for all other cases
 * - Safely falls back to `light` when `window`/`matchMedia` is unavailable
 *   (for example during SSR or non-browser execution)
 *
 * @returns {ResolvedTheme} System-resolved concrete theme
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

/**
 * Resolve a persisted theme preference to a concrete runtime theme.
 *
 * This helper is the canonical bridge between:
 * - `ThemeId` for preference storage and UI state (`dark | light | system`)
 * - `ResolvedTheme` for rendering/styling branches (`dark | light`)
 *
 * @param {ThemeId} theme - Persisted theme preference
 * @param {ResolvedTheme} [systemTheme=getSystemTheme()] - Optional pre-resolved
 * system theme override (useful for deterministic tests and batch resolution)
 * @returns {ResolvedTheme} Concrete theme used by runtime styling logic
 */
export function resolveTheme(
  theme: ThemeId,
  systemTheme: ResolvedTheme = getSystemTheme()
): ResolvedTheme {
  return theme === 'system' ? systemTheme : theme;
}
