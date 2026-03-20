/**
 * @file index.ts
 * @description Barrel export for SettingsContext module
 *
 * Re-exports public API for the SettingsContext module:
 * - SettingsProvider: Provider component for wrapping the app
 * - SettingsContext: React context instance (for hooks)
 * - Types: SettingsState, SettingsAction
 */

export { SettingsProvider } from './SettingsContext';
export { SettingsContext } from './SettingsContext.types';
export type { AppSettings, SettingsState, SettingsAction } from './SettingsContext.types';
