/**
 * @file useRouter.ts
 * @description Central routing hook for URL-based navigation and state
 *
 * This hook is the single source of truth for URL-based routing, providing:
 * - URL state reading: subPageId derived from current URL
 * - URL state writing: updateUrl() for programmatic navigation
 * - Root redirect: Redirects "/" to settings.defaultPage
 * - History sync: Responds to browser back/forward navigation
 *
 * URL Structure:
 * - /{page}                             - Page only (e.g., /physical, /traffic)
 * - /{page}/n/{nodeId}                  - Page with selected node
 * - /{page}/e/{edgeId}                  - Page with selected edge
 * - /traffic/{subPageId}/               - Traffic page with sub-page filter
 * - /traffic/{subPageId}/n/{nodeId}     - Traffic with sub-page + node
 * - /traffic/{subPageId}/e/{edgeId}     - Traffic with sub-page + edge
 *
 * Navigation Detection:
 * The hook listens for:
 * - popstate events (browser back/forward)
 * - pushState/replaceState (programmatic navigation via navigateTo)
 *
 * @example
 * // Read current sub-page filter
 * const { subPageId } = useRouter();
 *
 * // Update URL when user selects something
 * const { updateUrl } = useRouter();
 * updateUrl('physical', null, 'node', 'router-1');
 *
 * @see routing.ts - URL parsing and navigation utilities
 * @see useActivePage.ts - Hook for deriving active page from URL
 * @see useSelection.ts - Hook for deriving selection from URL
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useState, useEffect, useCallback, useMemo } from 'react';

import { useSettingsOrThrow } from '@/hooks/useSettings';
import type { PageId } from '@/utils/page';
import { parseRoute, navigateTo } from '@/utils/routing';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Return type for useRouter hook.
 *
 * @property {string | null} subPageId - Active sub-page ID, or null for all
 * @property {function} updateUrl - Function to update URL for navigation
 */
export interface UseRouterResult {
  subPageId: string | null;
  updateUrl: (
    page: PageId,
    subPageId: string | null,
    selectionType: 'node' | 'edge' | null,
    selectionId: string | null
  ) => void;
}

/* ============================================================================
 * HOOK IMPLEMENTATION
 * ============================================================================ */

/**
 * Central routing hook for URL-based navigation and state.
 *
 * Provides both reading and writing of URL state:
 * - subPageId: Current sub-page filter (derived from URL)
 * - updateUrl: Function to navigate to a new URL
 *
 * Also handles root URL redirect to default page from settings.
 *
 * @returns {UseRouterResult} Router state and utilities
 *
 * @example
 * function TrafficPage() {
 *   const { subPageId, updateUrl } = useRouter();
 *
 *   // subPageId is the current filter (null = all)
 *   const filteredData = subPageId ? filterBySubPage(data, subPageId) : data;
 *
 *   // Update URL on selection
 *   const handleNodeClick = (nodeId: string) => {
 *     updateUrl('traffic', subPageId, 'node', nodeId);
 *   };
 * }
 */
export function useRouter(): UseRouterResult {
  /* ==========================================================================
   * SETTINGS ACCESS
   * ========================================================================== */

  const { state: settingsState } = useSettingsOrThrow();

  /* ==========================================================================
   * URL STATE
   * ========================================================================== */

  /* Track current pathname to detect changes */
  const [pathname, setPathname] = useState(window.location.pathname);

  /* ==========================================================================
   * URL CHANGE LISTENERS
   * ========================================================================== */

  /**
   * Set up listeners for URL changes.
   *
   * We need to handle:
   * 1. popstate - fired when user clicks back/forward
   * 2. pushState/replaceState - NOT fired by browser, so we monkey-patch
   */
  useEffect(() => {
    /**
     * Handle popstate (browser back/forward navigation).
     */
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    /**
     * Monkey-patch history methods to detect programmatic navigation.
     * pushState and replaceState don't fire events, so we intercept them.
     */
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      setPathname(window.location.pathname);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      setPathname(window.location.pathname);
    };

    /**
     * Cleanup: restore original history methods and remove listener.
     */
    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  /* ==========================================================================
   * ROOT URL REDIRECT
   * ========================================================================== */

  /**
   * Redirect root URL to default page on initial load.
   *
   * SettingsProvider only renders children after settings are resolved, so
   * this can safely redirect using the configured default page.
   */
  useEffect(() => {
    if (window.location.pathname === '/') {
      history.replaceState(null, '', `/${settingsState.settings.defaultPage}`);
    }
  }, [settingsState.settings.defaultPage]);

  /* ==========================================================================
   * DERIVED STATE
   * ========================================================================== */

  /**
   * Parse the subPageId from the current pathname.
   * Memoized to avoid re-parsing on every render.
   */
  const subPageId = useMemo((): string | null => {
    const route = parseRoute(pathname);
    return route.subPageId;
  }, [pathname]);

  /* ==========================================================================
   * URL UPDATE HELPER
   * ========================================================================== */

  /**
   * Update URL when selection changes via user interaction.
   *
   * This function should be called by components when the user selects
   * a node/edge to keep the URL in sync with app state.
   *
   * @param {PageId} page - The current page
   * @param {string | null} subPageId - Sub-page ID for traffic page filtering
   * @param {'node' | 'edge' | null} selectionType - Type of selection
   * @param {string | null} selectionId - ID of selected item
   */
  const updateUrl = useCallback((
    page: PageId,
    subPageId: string | null,
    selectionType: 'node' | 'edge' | null,
    selectionId: string | null
  ) => {
    navigateTo(page, subPageId, selectionType, selectionId);
  }, []);

  /* ==========================================================================
   * RETURN
   * ========================================================================== */

  return { subPageId, updateUrl };
}
