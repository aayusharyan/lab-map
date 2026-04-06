/**
 * @file index.ts
 * @description Barrel export for notification stack components
 *
 * Public API:
 * - NotificationStack: Main notification display component
 * - NotificationItem: Individual notification card component
 * - NotificationItemProps: Props interface for NotificationItem
 * - NOTIFICATION_TITLES: Title text for each notification type
 *
 * Import style:
 * import { NotificationStack } from '@/components/NotificationStack';
 */

export { NotificationStack } from './NotificationStack';
export { NotificationItem, type NotificationItemProps } from './NotificationItem';
