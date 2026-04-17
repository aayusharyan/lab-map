/**
 * @file NotificationDetailsModal.types.ts
 * @description Props interface for the NotificationDetailsModal component
 *
 * @see NotificationDetailsModal.tsx - Component consuming these props
 * @see NotificationStack.tsx - Parent that manages modal open/close state
 */

import type { NotificationInput } from '@/utils/notification';

/* ============================================================================
 * NOTIFICATION DETAILS MODAL PROPS
 * ============================================================================ */

/**
 * Props for NotificationDetailsModal component.
 *
 * @property notification - The notification whose details are being shown
 * @property isClosing - Whether the modal is currently animating out
 * @property onClose - Callback to trigger the closing sequence
 */
export interface NotificationDetailsModalProps {
  notification: NotificationInput;
  isClosing: boolean;
  onClose: () => void;
}
