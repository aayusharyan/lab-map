/**
 * @file theme.types.ts
 * @description Theme type definitions for preference and runtime resolution
 *
 * This file defines canonical theme models shared by:
 * - Theme registry constants (`THEMES`, `THEME_IDS`)
 * - Settings state and persistence (`SettingsContext`)
 * - Runtime resolution logic (`useTheme`, `resolveTheme`)
 * - Theme-aware style helpers (`nodeType`, `edgeType`)
 *
 * Type Categories:
 * 1. Theme - Canonical display metadata for a theme option
 * 2. ThemeId - Persisted preference value (`dark | light | system`)
 * 3. ResolvedTheme - Concrete runtime value (`dark | light`)
 *
 * Data Flow:
 * 1. UI/settings persist `ThemeId` (can include `system`)
 * 2. Runtime resolves `ThemeId` + system preference into `ResolvedTheme`
 * 3. Rendering/styling consumes only `ResolvedTheme`
 *
 * @see theme.ts - Theme registry and runtime helpers
 * @see useTheme.ts - Hook that resolves system + user preference
 * @see SettingsContext.types.ts - Settings model using ThemeId
 */

/* ============================================================================
 * THEME MODELS
 * Shared between settings persistence and runtime styling
 * ============================================================================ */

/**
 * Canonical theme metadata used by settings UI and selectors.
 *
 * @property {string} id - Theme option identifier (e.g., "dark", "system")
 * @property {string} label - Human-readable option label (e.g., "Dark")
 */
export interface Theme {
  id: string;
  label: string;
}

/**
 * Theme preference key stored in settings and localStorage.
 *
 * Includes `system` because user intent can defer to OS preference.
 */
export type ThemeId = 'dark' | 'light' | 'system';

/**
 * Concrete runtime theme used by rendering/styling branches.
 *
 * This type excludes `system` because runtime code needs a resolved value.
 */
export type ResolvedTheme = 'dark' | 'light';
