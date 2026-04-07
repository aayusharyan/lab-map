/**
 * @file useSelection.ts
 * @description Hook for deriving selection state from URL
 *
 * This hook derives the selected node/edge from the URL, using the URL
 * as the single source of truth for selection state. It parses the current
 * URL to get the selection ID, then finds the corresponding object in
 * the provided data.
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
 * - /{page}/n/{nodeId} - Node selection
 * - /{page}/e/{edgeId} - Edge selection
 *
 * Benefits of URL-based selection:
 * - Single source of truth (no sync issues)
 * - Deep linking works automatically
 * - Browser back/forward navigation works correctly
 * - Shareable URLs with selection state
 *
 * @example
 * function PhysicalPage() {
 *   const { data } = useLocalPageData();
 *   const { selectedNode, selectedEdge } = useSelection(
 *     data?.nodes || [],
 *     data?.edges || []
 *   );
 *
 *   return <Sidebar selectedNode={selectedNode} selectedEdge={selectedEdge} />;
 * }
 *
 * @see routing.ts - URL parsing utilities
 * @see useActivePage.ts - Similar pattern for page state
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useState, useEffect, useMemo } from 'react';

import type { RawNode, RawEdge } from '@/types/topology';
import { parseRoute } from '@/utils/routing';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Result of the useSelection hook.
 *
 * @property {RawNode | null} selectedNode - The selected node object, or null
 * @property {RawEdge | null} selectedEdge - The selected edge object, or null
 * @property {string | null} selectionId - The raw selection ID from URL
 * @property {'node' | 'edge' | null} selectionType - The type of selection
 */
export interface UseSelectionResult {
  selectedNode: RawNode | null;
  selectedEdge: RawEdge | null;
  selectionId: string | null;
  selectionType: 'node' | 'edge' | null;
}

/* ============================================================================
 * HOOK IMPLEMENTATION
 * ============================================================================ */

/**
 * Hook for deriving selection state from URL.
 *
 * Parses the current URL to get selection type and ID, then finds the
 * corresponding node/edge in the provided data arrays.
 *
 * Automatically updates when:
 * - Browser navigation occurs (back/forward)
 * - The data arrays change (e.g., after loading)
 *
 * @param {RawNode[]} nodes - Array of nodes to search for selection
 * @param {RawEdge[]} edges - Array of edges to search for selection
 * @returns {UseSelectionResult} Selection state derived from URL
 *
 * @example
 * const { selectedNode, selectedEdge } = useSelection(nodes, edges);
 *
 * if (selectedNode) {
 *   console.log('Selected node:', selectedNode.id);
 * }
 */
export function useSelection(nodes: RawNode[], edges: RawEdge[]): UseSelectionResult {
  /* ==========================================================================
   * STATE
   * Track URL pathname to trigger re-renders on navigation
   * ========================================================================== */

  const [pathname, setPathname] = useState(window.location.pathname);

  /* ==========================================================================
   * URL SYNC EFFECT
   * Listen for browser navigation (back/forward) and URL changes
   * ========================================================================== */

  useEffect(() => {
    /**
     * Handle popstate events (browser back/forward).
     */
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    /**
     * Handle pushstate/replacestate events.
     * These are triggered by our navigateTo() calls.
     */
    const handlePushState = () => {
      setPathname(window.location.pathname);
    };

    /* Listen for navigation events */
    window.addEventListener('popstate', handlePopState);

    /**
     * Monkey-patch history methods to detect programmatic navigation.
     * This is needed because pushState/replaceState don't fire events.
     */
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handlePushState();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handlePushState();
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  /* ==========================================================================
   * PARSE URL AND FIND SELECTION
   * ========================================================================== */

  /**
   * Derive selection from URL and data.
   * Memoized to avoid re-parsing on every render.
   */
  const result = useMemo((): UseSelectionResult => {
    const route = parseRoute(pathname);
    const { selectionType, selectionId } = route;

    /* No selection in URL */
    if (!selectionType || !selectionId) {
      return {
        selectedNode: null,
        selectedEdge: null,
        selectionId: null,
        selectionType: null,
      };
    }

    /* Find selected node */
    if (selectionType === 'node') {
      const node = nodes.find(n => n.id === selectionId) || null;
      return {
        selectedNode: node,
        selectedEdge: null,
        selectionId,
        selectionType,
      };
    }

    /* Find selected edge */
    if (selectionType === 'edge') {
      const edge = edges.find(e => e.id === selectionId) || null;
      return {
        selectedNode: null,
        selectedEdge: edge,
        selectionId,
        selectionType,
      };
    }

    /* Fallback (shouldn't happen) */
    return {
      selectedNode: null,
      selectedEdge: null,
      selectionId: null,
      selectionType: null,
    };
  }, [pathname, nodes, edges]);

  return result;
}
