/**
 * @file AppContext.types.ts
 * @description AppContext type definitions and validation warning context creation
 *
 * This file defines the TypeScript interfaces and creates the React Context
 * instance for the application's shared validation warning state. It is
 * separated from AppContext.tsx to satisfy the react-refresh/only-export-components
 * ESLint rule, which requires that files exporting React components should not
 * also export non-component values.
 *
 * Architecture:
 * - AppState: The shape of the validation warning state
 * - AppAction: Union type of all possible validation warning actions
 * - AppContext: React Context instance for distributing warning state
 *
 * State Management Pattern:
 * This application uses the useReducer + Context pattern for validation
 * warnings that need to be shared across components. Components access state
 * via useAppContextOrThrow() hook and modify it by dispatching actions to the reducer.
 *
 * Note: User preferences (theme, font size, scroll-to-zoom) are managed
 * separately by SettingsContext for persistence via localStorage/default_settings.json.
 *
 * @see AppContext.tsx - Provider component and reducer implementation
 * @see useAppContext.ts - Hook for consuming the context
 * @see SettingsContext/SettingsContext.tsx - User preferences management
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { createContext } from 'react';

import type { ValidationWarning, ValidationWarningInput } from '@/utils/validationWarning';

/* ============================================================================
 * STATE INTERFACE
 * ============================================================================ */

/**
 * Shape of the shared validation warning state.
 *
 * Components read from this state via the useAppContextOrThrow() hook.
 * State is immutable and can only be modified by dispatching actions
 * to the reducer.
 *
 * Note: Active page is derived from URL via useActivePage hook.
 * Page data (nodes, edges, flows) and selection state are managed
 * locally by each page component via useLocalPageData and useSelection hooks.
 * User preferences (theme, font size, scroll-to-zoom) are managed by SettingsContext.
 *
 * @property {ValidationWarning[]} validationWarnings - Current validation warnings
 * @property {Record<string, true>} dismissedValidationHashes - Dismissed warnings keyed by stable hash.
 *   This uses a plain object as a set-like lookup table so the app can quickly
 *   check whether a warning has already been dismissed and avoid duplicate entries.
 */
export interface AppState {
  validationWarnings: ValidationWarning[];
  dismissedValidationHashes: Record<string, true>;
}

/* ============================================================================
 * ACTION TYPES
 * ============================================================================ */

/**
 * Union type of all possible actions that can be dispatched to modify AppState.
 *
 * Each action type corresponds to a case in the reducer function.
 * Actions follow the Flux Standard Action pattern with a 'type' property
 * and optional payload properties.
 *
 * Validation Actions:
 * - ADD_VALIDATION_WARNING: Add one warning at a time from raw warning input
 *   while computing the hash inside AppContext
 * - DISMISS_VALIDATION_WARNING: Hide one warning until its trace changes
 */
export type AppAction =
  | { type: 'ADD_VALIDATION_WARNING'; warning: ValidationWarningInput }
  | { type: 'DISMISS_VALIDATION_WARNING'; hash: string };

/* ============================================================================
 * CONTEXT INSTANCE
 * ============================================================================ */

/**
 * React Context instance for shared validation warning state.
 *
 * The context value contains:
 * - state: Current AppState (read-only)
 * - dispatch: Function to dispatch AppAction to modify state
 *
 * Default value is null to enforce usage within AppProvider.
 * The useAppContextOrThrow() hook throws an error if used outside the provider.
 *
 * @example
 * // In a component (use the hook instead of direct context access)
 * const { state, dispatch } = useAppContextOrThrow();
 * dispatch({
 *   type: 'ADD_VALIDATION_WARNING',
 *   warning: {
 *     message: 'Current file has validation errors.',
 *     trace: ['traffic.json', '/flows/0'],
 *   },
 * });
 */
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);
