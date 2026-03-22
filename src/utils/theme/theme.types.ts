/**
 * @file theme.types.ts
 * @description Shared theme identity types for styling, settings, and theme-aware utilities
 *
 * Theme model overview:
 * - `ThemeId` is the user preference persisted in settings (`dark | light | system`).
 * - A separate runtime type (`ResolvedTheme`) is used in render/styling paths where
 *   only concrete values are valid (`dark | light`).
 *
 * Why both exist:
 * - `system` is meaningful as a saved preference, but not as a final CSS/runtime value.
 * - Rendering code must branch on concrete themes only.
 */

/**
 * Valid theme identifiers.
 *
 * The application supports three theme preferences:
 * - dark: Dark background with light text
 * - light: Light background with dark text
 * - system: Follow the operating system theme (resolved at runtime)
 *
 * Use `ThemeId` for:
 * - Settings state
 * - Persistence (localStorage / config)
 * - User-facing theme controls
 */
export type ThemeId = 'dark' | 'light' | 'system';

/**
 * Concrete runtime theme used by rendering and styling logic.
 *
 * Unlike `ThemeId`, this cannot be `system` because UI code needs a
 * concrete value for CSS variables, icon variants, and conditional styles.
 */
export type ResolvedTheme = 'dark' | 'light';
