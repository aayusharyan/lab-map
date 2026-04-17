/**
 * @file PageLoading.tsx
 * @description Shared page/canvas loading overlay component
 *
 * Displays a centered loading spinner with an optional message inside the
 * canvas area while page-specific data is being fetched.
 *
 * @example
 * <PageLoading message="Loading physical topology…" />
 */

import styles from './PageLoading.module.css';

import type { PageLoadingProps } from './PageLoading.types';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Loading overlay displayed while fetching page data
 *
 * @param props - Component props
 * @param props.message - Loading message (defaults to "Loading…")
 */
export function PageLoading({ message = 'Loading…' }: PageLoadingProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <span>{message}</span>
    </div>
  );
}
