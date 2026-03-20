/**
 * @file validationWarning.types.ts
 * @description Type definitions for validation warnings
 *
 * This file defines the UI-facing validation warning model used by the app.
 * It is intentionally minimal and contains only the fields needed by the
 * warning system in AppContext and the warning banner UI.
 *
 * Type Categories:
 * 1. ValidationWarningInput - Caller-provided warning data before hashing
 * 2. ValidationWarning - Minimal warning model stored throughout the UI
 *
 * Data Flow:
 * 1. ValidationWarningManager reads raw validation metadata
 * 2. Metadata is normalized into ValidationWarningInput objects
 * 3. AppContext computes hashes and stores ValidationWarning objects
 * 4. ValidationWarning renders the warnings in the UI
 * 5. Dismissal state uses the computed warning hash
 *
 * @see ValidationWarningManager.tsx - Normalizes metadata into UI warnings
 * @see ValidationWarning.tsx - Renders warnings in the UI
 * @see AppContext.tsx - Stores warning state and dismissal hashes
 */

/* ============================================================================
 * VALIDATION WARNING INPUT TYPE
 * Caller-provided warning model before AppContext computes the hash
 * ============================================================================ */

/**
 * Validation warning input for UI display.
 *
 * This is the shape callers pass into AppContext when adding warnings.
 * The caller provides only the user-facing content, and AppContext derives
 * the stable hash from the trace so hashing logic stays centralized.
 *
 * A warning input contains the fields required to derive the stored warning:
 * - message: The human-readable summary shown in the banner
 * - trace: A list of strings describing where the warning came from
 *
 * @property {string} message - Human-readable warning summary
 * @property {string[]} trace - Ordered trace describing the warning source/path
 */
export interface ValidationWarningInput {
  message: string;
  trace: string[];
}

/* ============================================================================
 * VALIDATION WARNING TYPE
 * Stored warning model used throughout the UI after hashing
 * ============================================================================ */

/**
 * Validation warning stored in AppContext and rendered in the UI.
 *
 * This extends ValidationWarningInput with a stable lightweight hash that is
 * computed inside AppContext from the trace.
 *
 * The hash exists so the app can very quickly check whether a particular
 * warning has already been dismissed. Because the hash is derived from the
 * warning trace, the same warning produces the same hash every time.
 * This makes it more suitable than a UUID or timestamp, which would create
 * a new identifier even when the underlying warning has not changed.
 *
 * @property {string} hash - Stable lightweight hash used for quick dismissal checks
 *
 * @example
 * const warning: ValidationWarning = {
 *   message: 'Current file has validation errors.',
 *   trace: ['traffic.json', '/flows/0: must have required property "target"'],
 *   hash: 'abc123',
 * };
 */
export interface ValidationWarning extends ValidationWarningInput {
  hash: string;
}
