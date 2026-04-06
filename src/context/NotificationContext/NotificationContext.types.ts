/**
 * @file NotificationContext.types.ts
 * @description NotificationContext type definitions and context instance creation
 *
 * This file defines the TypeScript interfaces and creates the React Context
 * instance for notification state management. It is separated from
 * NotificationContext.tsx to satisfy the react-refresh/only-export-components
 * ESLint rule, which requires that files exporting React components should
 * not also export non-component values.
 *
 * Architecture:
 * - NotificationState: Internal state shape (notifications + dismissed hashes)
 * - NotificationAction: Union type of all possible dispatch actions
 * - NotificationContext: React Context instance for notification distribution
 *
 * @see NotificationContext.tsx - Provider component and reducer implementation
 * @see useNotification.ts - Hooks for consuming the context
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { createContext } from 'react';

import type { NotificationInput } from '@/utils/notification';

/* ============================================================================
 * STATE INTERFACE
 * ============================================================================ */

/**
 * Internal state shape for notification context.
 *
 * @property {Record<string, NotificationInput>} notifications - Active notifications keyed by their
 *   stable hash. The hash is derived from the trace inside the reducer and serves as both
 *   the unique identifier and the lookup key. Insertion order is preserved.
 * @property {Record<string, true>} dismissedNotificationHashes - Dismissed notifications keyed by stable hash.
 *   This uses a plain object as a set-like lookup table so the app can quickly
 *   check whether a notification has already been dismissed and avoid re-adding it.
 */
export interface NotificationState {
  notifications: Record<string, NotificationInput>;
  dismissedNotificationHashes: Record<string, true>;
}

/* ============================================================================
 * ACTION TYPES
 * ============================================================================ */

/**
 * Union type of all possible actions for the notification reducer.
 *
 * Each action type corresponds to a case in the reducer function.
 * Actions follow the Flux Standard Action pattern.
 *
 * Notification Management:
 * - ADD_NOTIFICATION: Add a notification (hash computed internally)
 * - DISMISS_NOTIFICATION: Dismiss a notification by hash
 * - CLEAR_ALL_NOTIFICATIONS: Remove all active notifications
 */
export type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; notification: NotificationInput }
  | { type: 'DISMISS_NOTIFICATION'; hash: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' };

/* ============================================================================
 * CONTEXT INSTANCE
 * ============================================================================ */

/**
 * React Context instance for notification state.
 *
 * The context value contains:
 * - state: Current NotificationState (read-only)
 * - dispatch: Function to dispatch NotificationAction to modify state
 *
 * Default value is null to enforce usage within NotificationProvider.
 * The useNotificationOrThrow() hook throws an error if used outside the provider.
 *
 * @example
 * // In a component (use the hook instead of direct context access)
 * const { addNotification } = useNotification();
 * addNotification({
 *   type: 'warning',
 *   message: 'Data file has validation errors.',
 *   trace: ['traffic.json', '/flows/0'],
 * });
 */
export const NotificationContext = createContext<{
  state: NotificationState;
  dispatch: React.Dispatch<NotificationAction>;
} | null>(null);
