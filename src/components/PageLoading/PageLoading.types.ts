/**
 * @file PageLoading.types.ts
 * @description Type definitions for the PageLoading component
 *
 * Defines the props interface for the shared loading overlay displayed
 * while page-specific data is being fetched.
 */

/* ============================================================================
 * PROPS INTERFACE
 * ============================================================================ */

/**
 * Props for the PageLoading component
 *
 * @property message - Optional loading message displayed below the spinner.
 *                     Defaults to "Loading…" if not provided.
 */
export interface PageLoadingProps {
  message?: string;
}
