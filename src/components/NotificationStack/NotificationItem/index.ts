/**
 * @file index.ts
 * @description Barrel export for NotificationItem
 *
 * Public API:
 * - NotificationItem: renders a single dismissible notification card
 * - type NotificationItemProps: props for NotificationItem
 *
 * @see NotificationItem.tsx - Component implementation
 * @see NotificationItem.types.ts - Prop type contracts
 *
 * Import style:
 * import { NotificationItem, type NotificationItemProps } from '@/components/NotificationStack/NotificationItem';
 */

export { NotificationItem } from './NotificationItem';
export type { NotificationItemProps } from './NotificationItem.types';
