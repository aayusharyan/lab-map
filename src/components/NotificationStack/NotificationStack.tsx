/**
 * @file NotificationStack.tsx
 * @description Notification stack container component
 *
 * Manages a stack of notification banners displayed in the top-right corner.
 * Handles stacking logic, animations, dismiss timing, and the trace modal.
 * Individual notifications are rendered via NotificationItem components.
 *
 * Features:
 * - Stacks up to 3 visible notifications with depth transforms
 * - Smooth entry/exit animations for notifications
 * - Modal dialog for viewing detailed trace information
 * - Keyboard accessibility (ESC to close modal)
 * - Auto-replacement from queue when top notifications are dismissed
 *
 * @example
 * // In App.tsx
 * <NotificationStack />
 *
 * @see NotificationStack.css - Stack container styles
 * @see NotificationItem.tsx - Individual notification component
 * @see NotificationContext.tsx - Notification state management
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useNotification } from '@/hooks/useNotification';
import type { NotificationInput } from '@/utils/notification';

import { NotificationItem } from './NotificationItem';

import './NotificationStack.css';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Notification stack component.
 *
 * Manages the display and lifecycle of stacked notification banners.
 * Shows up to 3 notifications simultaneously with depth-based transforms.
 * Handles dismiss animations, trace modal, and automatic queue replacement.
 *
 * Returns null when there are no visible notifications to display.
 *
 * @returns {JSX.Element | null} Notification stack or null if no notifications
 */
export function NotificationStack() {
  const { notifications, dismissNotification } = useNotification();
  const notificationEntries = Object.entries(notifications);
  const [exitingNotifications, setExitingNotifications] = useState<Record<string, number>>({});

  /* Count how many notifications in the first 3 positions are exiting, so we can
   * pull in replacements from the queue to fill those slots during the exit
   * animation. This ensures the 4th notification animates into position 3, etc. */
  const exitingInTop3Count = notificationEntries
    .slice(0, 3)
    .filter(([hash]) => exitingNotifications[hash] !== undefined)
    .length;
  const visibleEntries = notificationEntries.slice(0, 3 + exitingInTop3Count);
  const [traceModalNotification, setTraceModalNotification] = useState<NotificationInput | null>(null);
  const [isTraceModalClosing, setIsTraceModalClosing] = useState(false);
  const dismissTimeoutsRef = useRef<Record<string, number>>({});
  const traceModalCloseTimeoutRef = useRef<number | null>(null);

  /* Track whether the initial staggered entry animation has completed.
   * Replacement notifications entering from the queue should appear immediately,
   * only the initial batch gets the staggered delay. */
  const isInitializedRef = useRef(false);

  const activeDepthByNotificationKey = new Map(
    visibleEntries
      .filter(([hash]) => exitingNotifications[hash] === undefined)
      .map(([hash], index) => [hash, Math.min(index, 3)]),
  );

  useEffect(() => {
    /* Mark as initialized after first render so replacement notifications
     * from the queue don't get the staggered entry delay. */
    isInitializedRef.current = true;

    return () => {
      Object.values(dismissTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      if (traceModalCloseTimeoutRef.current !== null) {
        window.clearTimeout(traceModalCloseTimeoutRef.current);
      }
    };
  }, []);

  const openTraceModal = useCallback((notification: NotificationInput) => {
    if (traceModalCloseTimeoutRef.current !== null) {
      window.clearTimeout(traceModalCloseTimeoutRef.current);
      traceModalCloseTimeoutRef.current = null;
    }

    setIsTraceModalClosing(false);
    setTraceModalNotification(notification);
  }, []);

  const closeTraceModal = useCallback(() => {
    if (!traceModalNotification || isTraceModalClosing) return;

    setIsTraceModalClosing(true);
    traceModalCloseTimeoutRef.current = window.setTimeout(() => {
      setTraceModalNotification(null);
      setIsTraceModalClosing(false);
      traceModalCloseTimeoutRef.current = null;
    }, 180);
  }, [isTraceModalClosing, traceModalNotification]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTraceModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeTraceModal]);

  if (visibleEntries.length === 0) return null;

  const handleDismiss = (notificationKey: string, depth: number) => {
    if (exitingNotifications[notificationKey] !== undefined) return;

    setExitingNotifications((current) => ({ ...current, [notificationKey]: depth }));

    dismissTimeoutsRef.current[notificationKey] = window.setTimeout(() => {
      dismissNotification(notificationKey);

      delete dismissTimeoutsRef.current[notificationKey];
      setExitingNotifications((current) => {
        const next = { ...current };
        delete next[notificationKey];
        return next;
      });
    }, 300);
  };

  return (
    <div className="notification-stack">
      {visibleEntries.map(([hash, notification], index) => {
        const notificationKey = hash;
        const exitingDepth = exitingNotifications[notificationKey];
        const isExiting = exitingDepth !== undefined;
        const stackDepth = isExiting
          ? exitingDepth
          : (activeDepthByNotificationKey.get(notificationKey) ?? Math.min(index, 3));

        return (
          <NotificationItem
            key={notificationKey}
            isExiting={isExiting}
            isInitialMount={!isInitializedRef.current}
            notification={notification}
            onDismiss={() => handleDismiss(notificationKey, stackDepth)}
            onShowTrace={() => openTraceModal(notification)}
            stackDepth={stackDepth}
            stackIndex={index}
          />
        );
      })}

      {traceModalNotification && (
        <div
          aria-modal="true"
          className={`notification-trace-modal-backdrop${isTraceModalClosing ? ' is-closing' : ''}`}
          onClick={closeTraceModal}
          role="dialog"
        >
          <div
            className={`notification-trace-modal${isTraceModalClosing ? ' is-closing' : ''}`}
            data-type={traceModalNotification.type}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="notification-trace-modal-header">
              <strong>Notification Trace</strong>
              <button
                className="notification-trace-modal-close"
                onClick={closeTraceModal}
                type="button"
              >
                <IconX aria-hidden="true" stroke={2} />
              </button>
            </div>

            <p className="notification-trace-modal-message">
              {traceModalNotification.message}
            </p>

            <ol className="notification-trace-modal-list">
              {traceModalNotification.trace.map((traceEntry, idx) => (
                <li key={idx}>{traceEntry}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
