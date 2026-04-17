/**
 * @file notification.ts
 * @description Utility helpers for notification behavior
 *
 * This file contains lightweight utility logic used by the notification
 * system at runtime. It is intentionally colocated with the notification
 * types so the feature can live under a single directory.
 */

/* ============================================================================
 * NOTIFICATION HASHING
 * Lightweight stable hash used for dismissal tracking
 * ============================================================================ */

/**
 * Derive a stable lightweight hash from notification details.
 *
 * This hash is used to remember which notifications the user dismissed. The hash is
 * based only on the details contents, so a notification is treated as "the same"
 * notification as long as its details remain unchanged.
 *
 * This makes dismissal checks cheap and stable:
 * - AppContext can quickly test whether a notification hash is already dismissed
 * - The same notification details produce the same hash every time
 * - Unlike UUIDs or timestamps, identical notifications do not get a brand-new
 *   identifier on each refresh or poll
 *
 * Implementation notes:
 * - Uses a compact FNV-1a style 32-bit rolling hash
 * - Joins detail entries with a non-printable separator to preserve order
 * - Returns a short base-36 string for compact storage in AppContext
 * - Designed to be very cheap to compute in the browser
 *
 * @param {string[]} details - Notification detail entries in display order
 * @returns {string} Stable compact hash string for the notification details
 *
 * @example
 * const hash = getNotificationHash([
 *   'traffic.json',
 *   '/flows/0: must have required property "target"',
 * ]);
 * console.log(hash);
 */
export function getNotificationHash(details: string[]): string {
  const input = details.join('\u001f');
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}
