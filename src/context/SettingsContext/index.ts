/**
 * @file index.ts
 * @description Barrel export for SettingsContext module
 *
 * Public API:
 * - Context:
 *   - SettingsProvider
 *   - SettingsContext
 * - Types:
 *   - AppSettings, SettingsState, SettingsAction
 *   - FontSize (re-exported from @/types/font)
 *   - ScrollBehavior (re-exported from @/types/scroll)
 * - Constants:
 *   - FONT_SIZES (re-exported from @/types/font)
 *
 * Import style:
 * import { SettingsProvider, type AppSettings } from '@/context/SettingsContext';
 */

export { SettingsProvider } from './SettingsContext';
export { SettingsContext } from './SettingsContext.types';
export type { AppSettings, SettingsState, SettingsAction } from './SettingsContext.types';
export type { FontSize } from '@/types/font';
export type { ScrollBehavior } from '@/types/scroll';
export { FONT_SIZES } from '@/types/font';
