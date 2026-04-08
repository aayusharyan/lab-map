/**
 * @file useRoute.ts
 * @description Central routing hook for URL-based state
 *
 * This hook is the single source of truth for URL-based routing, providing:
 * - Full route state: page, subPageId, selectionType, selectionId
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
 * - pushState/replaceState (programmatic navigation)
 *
 * @example
 * import { useRoute } from '@/hooks/useRoute';
 *
 * function MyComponent() {
 *   const { page, subPageId } = useRoute();
 *   // Destructure only what you need
 * }
 *
 * @see routing.ts - URL parsing and navigation utilities
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useState, useEffect, useMemo } from 'react';

import { useSettingsOrThrow } from '@/hooks/useSettings';
import type { RouteState } from '@/utils/routing';
import { parseRoute } from '@/utils/routing';

/* ============================================================================
 * HOOK IMPLEMENTATION
 * ============================================================================ */

/**
 * Central routing hook for URL-based state.
 *
 * Returns the full route state parsed from the URL:
 * - page: Current page (physical, traffic, vlan, rack)
 * - subPageId: Sub-page filter for traffic page (null = all)
 * - selectionType: Type of selected item (node, edge, or null)
 * - selectionId: ID of selected item (or null)
 *
 * Also handles root URL redirect to default page from settings.
 *
 * @returns {RouteState} Full route state from URL
 *
 * @example
 * function PageTabs() {
 *   const { page } = useRoute();
 *   // Use page for active tab highlighting
 * }
 *
 * function TrafficFilters() {
 *   const { subPageId } = useRoute();
 *   // Use subPageId for filter pills
 * }
 *
 * function Sidebar() {
 *   const { page, selectionType, selectionId } = useRoute();
 *   // Use for conditional rendering based on selection
 * }
 */
export function useRoute(): RouteState {
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
   * Parse the full route state from current pathname.
   * Memoized to avoid re-parsing on every render.
   */
  const route = useMemo((): RouteState => {
    return parseRoute(pathname);
  }, [pathname]);

  return route;
}
