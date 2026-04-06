/**
 * @file NotificationItem.tsx
 * @description Individual notification card component
 *
 * Renders a single notification banner with icon, title, message, and controls.
 * Handles its own presentation including stack depth transforms and animations.
 * Part of the NotificationStack system.
 *
 * Features:
 * - Type-specific icon and color scheme
 * - Expandable trace details via "Show trace" button
 * - Dismissible with close button
 * - Stack depth-based transforms (scale, translate, opacity)
 * - Entry/exit animations
 *
 * @see NotificationItem.css - Component styles
 * @see NotificationStack.tsx - Parent container
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconX,
  IconXboxX,
} from '@tabler/icons-react';
import type { CSSProperties } from 'react';

import { NOTIFICATION_TITLES, type NotificationType } from '@/utils/notification';

import type { NotificationItemProps } from './NotificationItem.types';

import './NotificationItem.css';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/**
 * Icon component for each notification type.
 */
const NOTIFICATION_ICONS: Record<NotificationType, typeof IconAlertTriangle> = {
  'warning': IconAlertTriangle,
  'info': IconInfoCircle,
  'error': IconXboxX,
  'success': IconCheck,
};

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Individual notification card component.
 *
 * Displays a single notification with type-specific styling, icon, message,
 * and controls. Supports stack-based transforms and animations controlled
 * by parent NotificationStack component.
 *
 * @param {NotificationItemProps} props - Component props
 * @returns {JSX.Element} Notification card element
 */
export function NotificationItem({
  notification,
  stackDepth,
  stackIndex,
  isExiting,
  isInitialMount,
  onDismiss,
  onShowTrace,
}: NotificationItemProps) {
  const IconComponent = NOTIFICATION_ICONS[notification.type];
  const title = NOTIFICATION_TITLES[notification.type];

  return (
    <div
      className={`notification-shell${isExiting ? ' notification-shell-exit' : ''}`}
      style={
        {
          '--stack-depth': stackDepth,
          '--stack-z': String(100 - stackIndex),
          /* Only apply staggered entry delay on initial mount.
           * Replacement notifications from the queue should appear immediately. */
          '--stack-delay': isInitialMount ? `${stackIndex * 90}ms` : '0ms',
        } as CSSProperties
      }
    >
      <div
        className={`notification-card${isExiting ? ' notification-card-exit' : ''}`}
        data-type={notification.type}
      >
        <div className="notification-content">
          <div className="notification-icon">
            <IconComponent aria-hidden="true" stroke={1.8} />
          </div>

          <div className="notification-message">
            <strong>{title}</strong>
            <p>{notification.message}</p>

            {notification.trace.length > 0 && (
              <button
                className="notification-trace-link"
                onClick={onShowTrace}
                type="button"
              >
                Show trace
              </button>
            )}
          </div>

          <button
            className="notification-close"
            disabled={isExiting}
            onClick={onDismiss}
            title="Dismiss notification"
          >
            <IconX aria-hidden="true" stroke={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
