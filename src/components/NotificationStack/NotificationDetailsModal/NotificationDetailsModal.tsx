/**
 * @file NotificationDetailsModal.tsx
 * @description Modal dialog for expanded notification details
 *
 * Displays a notification's full message and details list in a centered
 * modal with backdrop. Handles its own enter/exit animations via CSS classes.
 * Open/close state is managed by the parent NotificationStack.
 *
 * @see NotificationDetailsModal.css - Modal styles
 * @see NotificationStack.tsx - Parent that controls open/close lifecycle
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { IconX } from '@tabler/icons-react';

import type { NotificationDetailsModalProps } from './NotificationDetailsModal.types';

import './NotificationDetailsModal.css';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Notification details modal component.
 *
 * Renders a backdrop and modal dialog showing the full details of a single
 * notification. Clicking the backdrop or close button triggers onClose.
 *
 * @param {NotificationDetailsModalProps} props - Component props
 * @returns {JSX.Element} Modal backdrop and dialog
 */
export function NotificationDetailsModal({
  notification,
  isClosing,
  onClose,
}: NotificationDetailsModalProps) {
  return (
    <div
      aria-modal="true"
      className={`notification-details-modal-backdrop${isClosing ? ' is-closing' : ''}`}
      onClick={onClose}
      role="dialog"
    >
      <div
        className={`notification-details-modal${isClosing ? ' is-closing' : ''}`}
        data-type={notification.type}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="notification-details-modal-header">
          <strong>Notification Details</strong>
          <button
            className="notification-details-modal-close"
            onClick={onClose}
            type="button"
          >
            <IconX aria-hidden="true" stroke={2} />
          </button>
        </div>

        <p className="notification-details-modal-message">
          {notification.message}
        </p>

        <ol className="notification-details-modal-list">
          {notification.details.map((detailEntry, idx) => (
            <li key={idx}>{detailEntry}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
