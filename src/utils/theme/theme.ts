/**
 * @file theme.ts
 * @description Canonical theme helpers for runtime theme resolution
 *
 * This module provides the core runtime logic for converting user theme
 * preferences into concrete theme values used by rendering and styling code.
 *
 * Exports:
 * - THEME_IDS: Canonical list of all valid theme preference identifiers
 * - isThemeId: Type guard for validating unknown theme values
 * - getSystemTheme: Browser/OS color-scheme resolver with SSR-safe fallback
 * - resolveTheme: Bridge from persisted `ThemeId` to concrete `ResolvedTheme`
 *
 * Theme model:
 * - `ThemeId` represents persisted user preference (`dark | light | system`)
 * - `ResolvedTheme` is concrete runtime theme (`dark | light`)
 *
 * @see theme.types.ts - Shared ThemeId and ResolvedTheme model
 * @see edgeType.ts - Theme-aware edge color resolution
 * @see nodeType.ts - Theme-aware node color resolution
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import type { ThemeId, ResolvedTheme } from './theme.types';

/* ============================================================================
 * THEME IDENTIFIERS
 * ============================================================================ */

/**
 * Canonical theme preference identifiers.
 *
 * Keep this aligned with `ThemeId` in `theme.types.ts`.
 * Used by settings UIs, validation helpers, and persistence boundaries.
 */
export const THEME_IDS: ThemeId[] = ['dark', 'light', 'system'];

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
  return THEME_IDS.includes(value as ThemeId);
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

