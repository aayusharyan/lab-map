/**
 * @file validationWarning.ts
 * @description Utility helpers for validation warning behavior
 *
 * This file contains lightweight utility logic used by the validation warning
 * system at runtime. It is intentionally colocated with the validation warning
 * types so the feature can live under a single directory.
 */

/* ============================================================================
 * WARNING HASHING
 * Lightweight stable hash used for dismissal tracking
 * ============================================================================ */

/**
 * Derive a stable lightweight hash from a warning trace.
 *
 * This hash is used to remember which warnings the user dismissed. The hash is
 * based only on the trace contents, so a warning is treated as "the same"
 * warning as long as its trace remains unchanged.
 *
 * This makes dismissal checks cheap and stable:
 * - AppContext can quickly test whether a warning hash is already dismissed
 * - The same warning trace produces the same hash every time
 * - Unlike UUIDs or timestamps, identical warnings do not get a brand-new
 *   identifier on each refresh or poll
 *
 * Implementation notes:
 * - Uses a compact FNV-1a style 32-bit rolling hash
 * - Joins trace segments with a non-printable separator to preserve order
 * - Returns a short base-36 string for compact storage in AppContext
 * - Designed to be very cheap to compute in the browser
 *
 * @param {string[]} trace - Warning trace entries in display order
 * @returns {string} Stable compact hash string for the warning trace
 *
 * @example
 * const hash = getValidationWarningHash([
 *   'traffic.json',
 *   '/flows/0: must have required property "target"',
 * ]);
 * console.log(hash);
 */
export function getValidationWarningHash(trace: string[]): string {
  const input = trace.join('\u001f');
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}
