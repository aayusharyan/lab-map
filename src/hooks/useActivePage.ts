/**
 * @file useActivePage.ts
 * @description Hook for deriving the active page from the URL
 *
 * This hook makes the URL the single source of truth for the active page.
 * Instead of storing activePage in AppContext, components use this hook
 * to derive the current page from the URL pathname.
 *
 * Hook Type: Browser API
 * This hook reads directly from browser APIs (window.location, history).
 * It does NOT require any React Context provider.
 *
 * Error Handling:
 * This hook does NOT throw errors because:
 * - It reads from window.location which always exists in a browser
 * - There's no provider that could be missing
 * - The browser environment guarantees these APIs are available
 *
 * This differs from context-based hooks (useAppContext, useSettings) which
 * throw errors when used outside their providers. Context hooks throw because
 * useContext returns undefined outside a provider, leading to cryptic errors.
 *
 * URL Structure:
 * - /{page}                 - Page only (e.g., /physical, /traffic)
 * - /{page}/n/{nodeId}      - Page with selected node
 * - /{page}/e/{edgeId}      - Page with selected edge
 *
 * Navigation Detection:
 * The hook listens for:
 * - popstate events (browser back/forward)
 * - pushState/replaceState (programmatic navigation via navigateTo)
 *
 * @example
 * import { useActivePage } from '@/hooks/useActivePage';
 *
 * function MyComponent() {
 *   const activePage = useActivePage();
 *   // activePage is 'physical' | 'traffic' | 'vlan' | 'rack'
 * }
 *
 * @see routing.ts - URL parsing and navigation utilities
 * @see useSelection.ts - Similar pattern for selection state
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useState, useEffect, useMemo } from 'react';

import type { PageId } from '@/utils/page';
import { parseRoute } from '@/utils/routing';

/* ============================================================================
 * HOOK IMPLEMENTATION
 * ============================================================================ */

/**
 * Hook that derives the active page from the URL.
 *
 * Returns the current page parsed from window.location.pathname.
 * Automatically updates when the URL changes via navigation.
 *
 * @returns {PageId} The current active page ID
 *
 * @example
 * const activePage = useActivePage();
 * if (activePage === 'rack') {
 *   // Show rack-specific controls
 * }
 */
export function useActivePage(): PageId {
  /* Track current pathname to detect changes */
  const [pathname, setPathname] = useState(window.location.pathname);

  /**
   * Set up listeners for URL changes.
   *
   * We need to handle:
   * 1. popstate - fired when user clicks back/forward
   * 2. pushState/replaceState - NOT fired by the browser, so we monkey-patch
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

  /**
   * Parse the page from the current pathname.
   * Memoized to avoid re-parsing on every render.
   */
  const activePage = useMemo((): PageId => {
    const route = parseRoute(pathname);
    return route.page;
  }, [pathname]);

  return activePage;
}
