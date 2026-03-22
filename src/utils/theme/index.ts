/**
 * @file index.ts
 * @description Barrel export for theme utilities
 *
 * Public API:
 * - Constants:
 *   - THEMES
 *   - THEME_IDS
 * - Helpers:
 *   - isThemeId
 *   - getThemeOrThrow
 *   - getSystemTheme
 *   - resolveTheme
 * - Types:
 *   - Theme
 *   - ThemeId
 *   - ResolvedTheme
 *
 * Import style:
 * import { THEMES, THEME_IDS, resolveTheme, type ThemeId } from '@/utils/theme';
 */

export {
  THEMES,
  THEME_IDS,
  isThemeId,
  getThemeOrThrow,
  getSystemTheme,
  resolveTheme,
} from './theme';
export type { Theme, ThemeId, ResolvedTheme } from './theme.types';
