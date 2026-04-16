/**
 * @file useValidationPolling.ts
 * @description Hook for polling validation metadata and dispatching notifications
 *
 * This hook encapsulates the validation polling logic previously in
 * ValidationWarningManager. It polls validation metadata for all pages,
 * converts errors to notifications, and dispatches them to NotificationContext.
 *
 * Features:
 * - Polls validation metadata every 2 seconds (configurable)
 * - Respects page visibility (pauses when tab is hidden)
 * - Tracks synced notification hashes to avoid duplicate dispatches
 * - Cleans up on unmount
 *
 * Why not a Web Worker?
 * This hook cannot be moved to a background Web Worker because:
 * 1. It dispatches to React context (useNotification) which only works in the main thread
 * 2. It reads document.visibilityState which is unavailable in Worker scope
 * 3. The polling interval is short and the work is minimal (fetch + hash check),
 *    so the main thread overhead is negligible
 *
 * @example
 * // In ValidationWarningManager or a dedicated provider
 * function ValidationPollingProvider() {
 *   useValidationPolling();
 *   return null;
 * }
 *
 * // With custom options
 * useValidationPolling({ intervalMs: 5000, isEnabled: someCondition });
 *
 * @see useNotification.ts - Hook for dispatching notifications
 * @see loadValidationMetadata - Loads validation metadata from data files
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useEffect, useRef } from 'react';

import { useNotification } from '@/hooks/useNotification';
import { loadValidationMetadata } from '@/utils/data';
import { getNotificationHash } from '@/utils/notification';
import { PAGE_IDS } from '@/utils/page';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/** Default polling interval in milliseconds */
const DEFAULT_POLL_INTERVAL_MS = 2000;

/* ============================================================================
 * TYPES
 * ============================================================================ */

/**
 * Configuration options for useValidationPolling hook.
 *
 * @property {number} [intervalMs=2000] - Polling interval in milliseconds
 * @property {boolean} [isEnabled=true] - Whether polling is enabled
 */
interface UseValidationPollingOptions {
  intervalMs?: number;
  isEnabled?: boolean;
}

/* ============================================================================
 * HOOK IMPLEMENTATION
 * ============================================================================ */

/**
 * Hook that polls validation metadata and dispatches notifications.
 *
 * This hook manages the validation polling lifecycle:
 * 1. Fetches validation metadata for all pages in parallel
 * 2. Converts validation errors to notifications
 * 3. Dispatches only new notifications (tracks via hash in ref)
 * 4. Respects page visibility to save resources
 *
 * The hook uses a ref to track synced hashes instead of relying on
 * the context's dismissedHashes because we want to avoid re-dispatching
 * notifications that were already sent this session, even if they
 * haven't been dismissed yet.
 *
 * @param {UseValidationPollingOptions} [options] - Configuration options
 */
export function useValidationPolling(options: UseValidationPollingOptions = {}) {
  const { intervalMs = DEFAULT_POLL_INTERVAL_MS, isEnabled = true } = options;
  const { addNotification, dismissedHashes } = useNotification();

  /**
   * Track which notification hashes have been synced this session.
   * This prevents dispatching the same notification multiple times
   * even if the user hasn't dismissed it yet.
   */
  const syncedHashesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isEnabled) return;

    let isCancelled = false;

    /**
     * Fetch validation metadata for all pages and dispatch notifications
     * for any validation errors found.
     */
    async function syncValidationNotifications() {
      /* Fetch metadata for all pages in parallel */
      const metadataByPage = await Promise.all(
        PAGE_IDS.map(async (pageId) => ({
          pageId,
          metadata: await loadValidationMetadata(pageId),
        })),
      );

      if (isCancelled) return;

      /* Convert validation errors to notifications */
      const notifications = metadataByPage.flatMap(({ pageId, metadata }) => {
        if (!metadata || metadata.valid) {
          return [];
        }

        const message = metadata.error || 'Data file has validation errors.';

        if (metadata.validationErrors.length > 0) {
          return metadata.validationErrors.map((validationError) => ({
            type: 'warning' as const,
            message,
            details: [`${pageId}.json`, validationError],
          }));
        }

        return [{
          type: 'warning' as const,
          message,
          details: [`${pageId}.json`, metadata.error || 'Unknown validation error'],
        }];
      });

      /* Dispatch only new notifications */
      notifications.forEach((notification) => {
        const hash = getNotificationHash(notification.details);

        /* Skip if already synced this session or dismissed by user */
        if (syncedHashesRef.current.has(hash) || dismissedHashes[hash]) {
          return;
        }

        /* Mark as synced and dispatch */
        syncedHashesRef.current.add(hash);
        addNotification(notification);
      });
    }

    /* Initial sync immediately on mount */
    void syncValidationNotifications();

    /* Set up polling interval */
    const intervalId = window.setInterval(() => {
      /* Skip if page is not visible to save resources */
      if (document.visibilityState !== 'visible') return;

      void syncValidationNotifications();
    }, intervalMs);

    /* Cleanup on unmount or when dependencies change */
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [addNotification, dismissedHashes, intervalMs, isEnabled]);
}
