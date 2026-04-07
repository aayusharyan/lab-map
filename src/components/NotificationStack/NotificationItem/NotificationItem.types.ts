/**
 * @file NotificationItem.types.ts
 * @description Props interface for the NotificationItem component
 *
 * Defines the props contract between NotificationStack (parent) and
 * NotificationItem (child). Stack depth and animation state are managed
 * by NotificationStack and passed down here for CSS variable injection.
 *
 * @see NotificationItem.tsx - Component consuming these props
 * @see NotificationStack.tsx - Parent that computes depth and exit state
 */

import type { NotificationInput } from '@/utils/notification';

/* ============================================================================
 * NOTIFICATION ITEM PROPS
 * ============================================================================ */

/**
 * Props for NotificationItem component.
 *
 * @property notification - The notification data to display
 * @property stackDepth - Position in the stack (0 = top, 1 = second, etc.)
 * @property stackIndex - Index in the visible notifications array (for z-index)
 * @property isExiting - Whether this notification is currently animating out
 * @property isInitialMount - Whether this is part of the initial batch (for staggered animation)
 * @property onDismiss - Callback when user clicks dismiss button
 * @property onShowTrace - Callback when user clicks "Show trace" button
 */
export interface NotificationItemProps {
  notification: NotificationInput;
  stackDepth: number;
  stackIndex: number;
  isExiting: boolean;
  isInitialMount: boolean;
  onDismiss: () => void;
  onShowTrace: () => void;
}
