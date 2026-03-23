/**
 * @file index.ts
 * @description Barrel export for AppContext module
 *
 * Public API:
 * - Context:
 *   - AppProvider
 *   - AppContext
 * - Types:
 *   - AppState
 *   - AppAction
 *
 * Import style:
 * import { AppProvider, AppContext, type AppState } from '@/context/AppContext';
 */

export { AppProvider } from './AppContext';
export { AppContext } from './AppContext.types';
export type { AppState, AppAction } from './AppContext.types';
