/**
 * @file notification.types.ts
 * @description Type definitions for the generic notification system
 *
 * This file defines the UI-facing notification model used by the app.
 * Notifications support multiple types (warning, info, error, success)
 * while maintaining a consistent structure for the notification stack UI.
 *
 * Type Categories:
 * 1. NotificationType - Union of supported notification types
 * 2. NotificationInput - Caller-provided notification data (also stored as Record values)
 *
 * Data Flow:
 * 1. Feature-specific managers create NotificationInput objects
 * 2. NotificationContext computes hashes and stores them as Record keys
 * 3. NotificationStack renders the notifications in the UI
 * 4. Dismissal state uses the computed notification hash (same key)
 *
 * @see NotificationStack.tsx - Renders notifications in the UI
 * @see NotificationContext.tsx - Stores notification state as Record<hash, NotificationInput>
 */

/* ============================================================================
 * NOTIFICATION TYPE ENUM
 * Supported notification categories with distinct styling
 * ============================================================================ */

/**
 * Supported notification types.
 *
 * Each type has distinct styling and behavior:
 * - warning: Warning messages (yellow/amber)
 * - info: Informational messages (blue)
 * - error: Critical errors (red)
 * - success: Success confirmations (green)
 *
 * @example
 * const type: NotificationType = 'warning';
 */
export type NotificationType = 'warning' | 'info' | 'error' | 'success';

/* ============================================================================
 * NOTIFICATION INPUT TYPE
 * Notification data provided by callers and stored as Record values
 * ============================================================================ */

/**
 * Notification data for UI display.
 *
 * This is both the shape callers pass into NotificationContext when adding
 * notifications, and the value type stored in the notifications Record.
 * The hash is derived from the trace inside the reducer and stored as the
 * Record key, so hashing logic stays centralized and callers cannot control it.
 *
 * Fields:
 * - type: The notification category (determines styling)
 * - message: The human-readable summary shown in the banner
 * - trace: A list of strings describing where the notification came from
 *
 * @property {NotificationType} type - Notification category for styling
 * @property {string} message - Human-readable notification summary
 * @property {string[]} trace - Ordered trace describing the notification source/path
 */
export interface NotificationInput {
  type: NotificationType;
  message: string;
  trace: string[];
}

/* ============================================================================
 * NOTIFICATION CONSTANTS
 * ============================================================================ */

/**
 * Title text for each notification type.
 */
export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  'warning': 'Warning',
  'info': 'Information',
  'error': 'Error',
  'success': 'Success',
};
