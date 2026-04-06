/**
 * @file index.ts
 * @description Barrel export for notification utilities
 *
 * Public API:
 * - Helpers:
 *   - getNotificationHash
 * - Types:
 *   - NotificationInput
 *   - NotificationType
 *
 * Import style:
 * import { getNotificationHash, type NotificationInput } from '@/utils/notification';
 */

export { getNotificationHash } from './notification';
export {
  NOTIFICATION_TITLES,
  type NotificationInput,
  type NotificationType,
} from './notification.types';
