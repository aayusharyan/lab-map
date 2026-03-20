/**
 * @file theme.ts
 * @description Shared theme identity types for styling, settings, and theme-aware utilities
 */

/**
 * Valid theme identifiers.
 *
 * The application supports three theme preferences:
 * - dark: Dark background with light text
 * - light: Light background with dark text
 * - system: Follow the operating system theme
 */
export type ThemeId = 'dark' | 'light' | 'system';
