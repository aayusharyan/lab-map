/**
 * @file useNotification.ts
 * @description Hooks for accessing notification state and dispatching notifications
 *
 * This file provides hooks for accessing notifications managed by
 * NotificationContext. They are separated from NotificationContext.tsx to
 * satisfy the react-refresh/only-export-components ESLint rule.
 *
 * Hook Type: Context-based
 * These are context consumer hooks that wrap React's useContext. They require
 * the component tree to be wrapped in NotificationProvider.
 *
 * Error Handling:
 * useNotificationOrThrow() throws an error if used outside of NotificationProvider:
 * - React's useContext returns undefined when used outside a provider
 * - Without validation, you'd get cryptic "cannot read property of undefined"
 * - Throwing early catches setup mistakes during development
 *
 * Available Hooks:
 * 1. useNotificationOrThrow() - Full context access (state + dispatch)
 * 2. useNotification() - Ergonomic API with helper methods
 * 3. useNotificationList() - Just the notifications Record
 *
 * @example
 * // Full context access
 * const { state, dispatch } = useNotificationOrThrow();
 * dispatch({ type: 'ADD_NOTIFICATION', notification: {...} });
 *
 * // Ergonomic API (recommended)
 * const { notifications, addNotification, dismissNotification } = useNotification();
 * addNotification({ type: 'info', message: 'Hello', trace: [] });
 *
 * // Just the list
 * const notifications = useNotificationList();
 *
 * @see NotificationContext/NotificationContext.tsx - Provider and reducer
 * @see NotificationContext/NotificationContext.types.ts - Type definitions
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useContext, useCallback } from 'react';

import { NotificationContext } from '@/context/NotificationContext';
import type { NotificationInput } from '@/utils/notification';

/* ============================================================================
 * HOOKS
 * ============================================================================ */

/**
 * Hook to access full notification state and dispatch function.
 *
 * Provides complete access to the notification context, including:
 * - state.notifications: Array of active notifications
 * - state.dismissedNotificationHashes: Record of dismissed hashes
 * - dispatch: Function to dispatch actions to modify state
 *
 * @returns {object} Object containing state and dispatch
 * @throws {Error} If used outside of NotificationProvider
 *
 * @example
 * const { state, dispatch } = useNotificationOrThrow();
 *
 * // Add notification
 * dispatch({
 *   type: 'ADD_NOTIFICATION',
 *   notification: { type: 'info', message: 'Hello', trace: [] }
 * });
 *
 * // Dismiss notification
 * dispatch({ type: 'DISMISS_NOTIFICATION', hash: 'abc123' });
 */
export function useNotificationOrThrow() {
  const ctx = useContext(NotificationContext);

  /**
   * Throw descriptive error if hook is used outside provider.
   */
  if (!ctx) {
    throw new Error('useNotificationOrThrow must be used within NotificationProvider');
  }

  return ctx;
}

/**
 * Hook with ergonomic API for notification management.
 *
 * Provides helper methods for common operations instead of
 * requiring manual dispatch calls. This is the recommended hook
 * for most use cases.
 *
 * @returns {object} Notification state and helper methods
 * @throws {Error} If used outside of NotificationProvider
 *
 * @example
 * const { notifications, addNotification, dismissNotification } = useNotification();
 *
 * // Add a notification
 * addNotification({
 *   type: 'warning',
 *   message: 'Data file has errors',
 *   trace: ['physical.json', '/nodes/0'],
 * });
 *
 * // Dismiss by hash
 * dismissNotification(Object.keys(notifications)[0]);
 *
 * // Clear all
 * clearAllNotifications();
 */
export function useNotification() {
  const { state, dispatch } = useNotificationOrThrow();

  /**
   * Add a new notification.
   * Hash is computed internally by the reducer.
   */
  const addNotification = useCallback(
    (notification: NotificationInput) => {
      dispatch({ type: 'ADD_NOTIFICATION', notification });
    },
    [dispatch],
  );

  /**
   * Dismiss a notification by its hash.
   * The hash is recorded to prevent re-adding the same notification.
   */
  const dismissNotification = useCallback(
    (hash: string) => {
      dispatch({ type: 'DISMISS_NOTIFICATION', hash });
    },
    [dispatch],
  );

  /**
   * Clear all active notifications.
   * Does not affect the dismissed hashes record.
   */
  const clearAllNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  }, [dispatch]);

  return {
    /** Current active notifications */
    notifications: state.notifications,

    /** Record of dismissed notification hashes */
    dismissedHashes: state.dismissedNotificationHashes,

    /** Add a new notification */
    addNotification,

    /** Dismiss a notification by hash */
    dismissNotification,

    /** Clear all active notifications */
    clearAllNotifications,
  };
}

/**
 * Hook to access just the notifications Record.
 *
 * Convenience hook when you only need to read notifications
 * and don't need to modify them.
 *
 * @returns {Record<string, NotificationInput>} Active notifications keyed by hash
 * @throws {Error} If used outside of NotificationProvider
 *
 * @example
 * const notifications = useNotificationList();
 *
 * // Render notification count
 * return <Badge count={Object.keys(notifications).length} />;
 */
export function useNotificationList() {
  const { state } = useNotificationOrThrow();
  return state.notifications;
}
