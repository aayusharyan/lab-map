/**
 * @file AppContext.tsx
 * @description Global validation warning state using React Context + useReducer
 *
 * This file implements the shared validation warning state for the Lab Map
 * application using React's Context API combined with useReducer for
 * predictable state updates.
 *
 * Architecture:
 * - Provider component wraps the app root
 * - Reducer handles all state transitions immutably
 * - Components access state via useAppContext() hook
 *
 * State Categories:
 * - Validation warnings: Normalized UI warnings with message, trace, and hash
 *
 * Note: Active page and selection state are derived from URL via
 * useActivePage and useSelection hooks in components.
 * User preferences (theme, font size, scroll-to-zoom) are managed by SettingsContext.
 *
 * @example
 * // Wrap app root with provider
 * <AppProvider>{children}</AppProvider>
 *
 * // Access state and dispatch in components
 * const { state, dispatch } = useAppContext();
 * dispatch({
 *   type: 'ADD_VALIDATION_WARNING',
 *   warning: {
 *     message: 'Current file has validation errors.',
 *     trace: ['traffic.json', '/flows/0'],
 *   },
 * });
 *
 * @see AppContext.types.ts - Type definitions and context creation
 * @see useAppContext.ts - Hook for consuming the context
 * @see SettingsContext/SettingsContext.tsx - User preferences management
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useReducer, useMemo, type ReactNode } from 'react';

import {
  getValidationWarningHash,
  type ValidationWarning,
  type ValidationWarningInput,
} from '@/utils/validationWarning';

import { AppContext } from './AppContext.types';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Shape of the global validation warning state.
 * Components read from this state via useAppContext().
 *
 * Note: Active page is derived from URL via useActivePage hook.
 * Page data (nodes, edges, flows) and selection state are managed
 * locally by each page component via useLocalPageData and useSelection hooks.
 * User preferences (theme, font size, scroll-to-zoom) are managed by SettingsContext.
 *
 * @see AppContext.types.ts for detailed property documentation
 * @see SettingsContext/SettingsContext.tsx for user preferences
 */
export interface AppState {
  validationWarnings: ValidationWarning[];
  dismissedValidationHashes: Record<string, true>;
}

/**
 * All possible actions that can be dispatched to modify AppState.
 * Each action type corresponds to a case in the reducer function.
 *
 * @see AppContext.types.ts for detailed action documentation
 */
export type AppAction =
  | { type: 'ADD_VALIDATION_WARNING'; warning: ValidationWarningInput }
  | { type: 'DISMISS_VALIDATION_WARNING'; hash: string };

/* ============================================================================
 * INITIAL STATE
 * ============================================================================ */

/**
 * Default validation warning state on app startup.
 *
 * Active page is derived from URL via useActivePage hook.
 * Page data (nodes, edges) is managed locally by each page component.
 * User preferences are managed by SettingsContext.
 */
const initialState: AppState = {
  validationWarnings: [],
  dismissedValidationHashes: {},
};

/* ============================================================================
 * REDUCER
 * ============================================================================ */

/**
 * Pure reducer function that handles validation warning state transitions.
 *
 * Each case returns a new state object (immutable updates).
 * The reducer follows Redux conventions:
 * - State is read-only, never mutated directly
 * - Returns new state object for each action
 * - Unknown actions return current state unchanged
 *
 * @param {AppState} state - Current application state
 * @param {AppAction} action - Action to process
 * @returns {AppState} New state after applying the action
 */
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    /* ========================================================================
     * VALIDATION WARNING ACTIONS
     * ======================================================================== */

    /**
     * Add one warning from raw warning input.
     * Hash is derived here so callers cannot provide or control it.
     */
    case 'ADD_VALIDATION_WARNING': {
      const hash = getValidationWarningHash(action.warning.trace);

      // If already dismissed, then do not add it back
      if (state.dismissedValidationHashes[hash]) {
        return state;
      }

      // If already present, then do not add it again
      if (state.validationWarnings.some((warning) => warning.hash === hash)) {
        return state;
      }

      return {
        ...state,
        validationWarnings: [
          ...state.validationWarnings,
          {
            ...action.warning,
            hash,
          },
        ],
      };
    }

    /**
     * Dismiss a warning by its stable hash.
     */
    case 'DISMISS_VALIDATION_WARNING':
      return {
        ...state,
        dismissedValidationHashes: {
          ...state.dismissedValidationHashes,
          [action.hash]: true,
        },
        validationWarnings: state.validationWarnings.filter(
          (warning) => warning.hash !== action.hash,
        ),
      };

    /* ========================================================================
     * DEFAULT CASE
     * Return unchanged state for unknown actions
     * ======================================================================== */
    default:
      return state;
  }
}

/* ============================================================================
 * PROVIDER COMPONENT
 * ============================================================================ */

/**
 * Provider component that wraps the app root.
 *
 * Initializes the reducer with initial state and provides the context
 * value to all child components. The context value is memoized to
 * prevent unnecessary re-renders.
 *
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} Provider component with children
 *
 * @example
 * // In main.tsx
 * <AppProvider>
 *   <App />
 * </AppProvider>
 */
export function AppProvider({ children }: { children: ReactNode }) {
  /**
   * Initialize reducer with initial state.
   * Returns current state and dispatch function.
   */
  const [state, dispatch] = useReducer(reducer, initialState);

  /**
   * Memoize context value to prevent re-renders.
   * Only creates new object when state changes.
   */
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
