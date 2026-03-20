/**
 * @file index.ts
 * @description Barrel export for AppContext module
 *
 * Re-exports public API for the AppContext module:
 * - AppProvider: Provider component for shared validation warnings
 * - AppContext: React context instance (used by hooks)
 * - Types: AppState, AppAction
 */

export { AppProvider } from './AppContext';
export { AppContext } from './AppContext.types';
export type { AppState, AppAction } from './AppContext.types';
