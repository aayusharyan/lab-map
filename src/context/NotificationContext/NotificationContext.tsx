/**
 * @file NotificationContext.tsx
 * @description Notification state management using React Context + useReducer
 *
 * This file implements shared notification state for the Lab Map application.
 * Notifications can be dispatched from anywhere in the app and are displayed
 * by the NotificationStack component.
 *
 * Architecture:
 * - Provider component wraps the app root
 * - Reducer handles all state transitions immutably
 * - Components access state via useNotification hooks
 *
 * @example
 * // Wrap app root with provider
 * <NotificationProvider>{children}</NotificationProvider>
 *
 * // Dispatch notification from any component
 * const { addNotification } = useNotification();
 * addNotification({
 *   type: 'warning',
 *   message: 'Data file has validation errors.',
 *   trace: ['traffic.json', '/flows/0'],
 * });
 *
 * @see NotificationContext.types.ts - Type definitions and context creation
 * @see useNotification.ts - Hooks for consuming the context
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useReducer, useMemo, type ReactNode } from 'react';

import { getNotificationHash } from '@/utils/notification';

import {
  NotificationContext,
  type NotificationState,
  type NotificationAction,
} from './NotificationContext.types';

/* ============================================================================
 * INITIAL STATE
 * ============================================================================ */

/**
 * Default notification state on app startup.
 * Both records start empty - notifications are added dynamically.
 */
const initialState: NotificationState = {
  notifications: {},
  dismissedNotificationHashes: {},
};

/* ============================================================================
 * REDUCER
 * ============================================================================ */

/**
 * Pure reducer function that handles notification state transitions.
 *
 * Each case returns a new state object (immutable updates).
 * The reducer follows Redux conventions:
 * - State is read-only, never mutated directly
 * - Returns new state object for each action
 * - Unknown actions return current state unchanged
 *
 * @param {NotificationState} state - Current notification state
 * @param {NotificationAction} action - Action to process
 * @returns {NotificationState} New state after applying the action
 */
function reducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    /* ========================================================================
     * ADD_NOTIFICATION
     * Add one notification from raw notification input.
     * Hash is derived here so callers cannot provide or control it.
     * ======================================================================== */
    case 'ADD_NOTIFICATION': {
      const hash = getNotificationHash(action.notification.trace);

      /* If already dismissed, do not add it back */
      if (state.dismissedNotificationHashes[hash]) {
        return state;
      }

      /* If already present, do not add it again */
      if (state.notifications[hash]) {
        return state;
      }

      return {
        ...state,
        notifications: {
          ...state.notifications,
          [hash]: action.notification,
        },
      };
    }

    /* ========================================================================
     * DISMISS_NOTIFICATION
     * Dismiss a notification by its stable hash.
     * ======================================================================== */
    case 'DISMISS_NOTIFICATION': {
      const { [action.hash]: _removed, ...remainingNotifications } = state.notifications;
      return {
        ...state,
        dismissedNotificationHashes: {
          ...state.dismissedNotificationHashes,
          [action.hash]: true,
        },
        notifications: remainingNotifications,
      };
    }

    /* ========================================================================
     * CLEAR_ALL_NOTIFICATIONS
     * Remove all active notifications without marking them as dismissed.
     * ======================================================================== */
    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: {},
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
 * Provider component that wraps the app root for notification state.
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
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
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
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
