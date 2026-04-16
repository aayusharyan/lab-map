/**
 * @file RouteContext.tsx
 * @description Single-source routing state provider for URL-based navigation
 *
 * This file centralizes all history monkey-patching and URL parsing into one
 * provider component. A single `RouteProvider` patches `history.pushState` and
 * `history.replaceState` exactly once, then exposes the parsed route state via
 * React context. All consumers call `useRoute()` which reads from this context
 * instead of independently patching history.
 *
 * Key Features:
 * - Patches history exactly once — no stacking patches from nested components
 * - Handles root URL redirect to settings.defaultPage
 * - Provides full RouteState (page, subPageId, selectionType, selectionId)
 *
 * @see useRoute.ts - Thin hook wrapper that reads from this context
 * @see routing.ts - URL parsing (parseRoute) and navigation utilities
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';

import { useSettingsOrThrow } from '@/hooks/useSettings';
import type { RouteState } from '@/utils/routing';
import { parseRoute } from '@/utils/routing';

/* ============================================================================
 * CONTEXT DEFINITION
 * ============================================================================ */

/**
 * Default route state used before the provider resolves.
 * Points to 'physical' page with no selection — a safe fallback.
 */
const DEFAULT_ROUTE: RouteState = {
  page: 'physical',
  subPageId: null,
  selectionType: null,
  selectionId: null,
};

/**
 * Context that holds the parsed route state.
 * Consumed by useRoute() — do not import directly.
 */
export const RouteContext = createContext<RouteState>(DEFAULT_ROUTE);

/* ============================================================================
 * PROVIDER COMPONENT
 * ============================================================================ */

/**
 * RouteProvider - single history patch point for URL-based routing.
 *
 * Must be placed inside SettingsProvider (needs defaultPage for root redirect).
 * Wraps the entire app so all useRoute() calls share one source of truth.
 *
 * @param {{ children: ReactNode }} props
 * @returns Provider element wrapping children with route context
 */
export function RouteProvider({ children }: { children: ReactNode }) {
  const { state: settingsState } = useSettingsOrThrow();

  /* Track current pathname — updated on every navigation event */
  const [pathname, setPathname] = useState(window.location.pathname);

  /* ==========================================================================
   * HISTORY PATCH (runs once, at the provider level)
   * ========================================================================== */

  /**
   * Patch history.pushState and history.replaceState exactly once.
   * All calls to these methods — from any component — flow through here.
   * Cleans up by restoring the originals on unmount.
   */
  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);

    window.addEventListener('popstate', handleNavigation);

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleNavigation();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  /* ==========================================================================
   * ROOT URL REDIRECT
   * ========================================================================== */

  /**
   * Redirect root URL to the configured default page on initial load.
   * SettingsProvider resolves settings before rendering children, so
   * defaultPage is always available here.
   */
  useEffect(() => {
    if (window.location.pathname === '/') {
      history.replaceState(null, '', `/${settingsState.settings.defaultPage}`);
    }
  }, [settingsState.settings.defaultPage]);

  /* ==========================================================================
   * ROUTE STATE
   * ========================================================================== */

  /**
   * Parse the route state from the current pathname.
   * Memoized to avoid re-parsing on unrelated renders.
   */
  const route = useMemo((): RouteState => parseRoute(pathname), [pathname]);

  return <RouteContext.Provider value={route}>{children}</RouteContext.Provider>;
}
