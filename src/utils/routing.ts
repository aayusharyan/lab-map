/**
 * @file routing.ts
 * @description URL routing utilities for path-based navigation with deep linking
 *
 * This file provides utility functions for URL-based routing in the application.
 * It enables deep linking so users can bookmark or share specific views.
 *
 * URL Structure:
 * - /{page}                             - Page only (e.g., /physical, /traffic)
 * - /{page}/n/{nodeId}                  - Page with selected node
 * - /{page}/e/{edgeId}                  - Page with selected edge
 * - /traffic/{subPageId}/               - Traffic page with sub-page filter
 * - /traffic/{subPageId}/n/{nodeId}     - Traffic page with sub-page + node selection
 * - /traffic/{subPageId}/e/{edgeId}     - Traffic page with sub-page + edge selection
 *
 * Examples:
 * - /physical                           - Physical page, no selection
 * - /physical/n/router1                 - Physical page, router1 node selected
 * - /traffic/e/tr_srv1_srv2             - Traffic page, all sub-pages, edge selected
 * - /traffic/flow_dns/                  - Traffic page, DNS sub-page filter active
 * - /traffic/flow_dns/n/dns-srv         - Traffic page, DNS sub-page, node selected
 *
 * Reserved prefixes: 'n' for node selection, 'e' for edge selection.
 *
 * @example
 * import { navigateToNode, navigateToPage, clearSelection } from '@/utils/routing';
 *
 * // High-level navigation (preferred)
 * navigateToNode('router1');      // Select node, preserve page/subPage
 * navigateToEdge('edge1');        // Select edge, preserve page/subPage
 * navigateToPage('traffic');      // Change page, clear selection
 * navigateToSubPage('flow_dns');  // Change sub-page, clear selection
 * clearSelection();               // Clear selection, preserve page/subPage
 *
 * // Low-level (for special cases)
 * navigateTo('traffic', 'flow_dns', 'node', 'node1');
 *
 * @see useRoute.ts - Hook that uses these functions
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { isPageId, type PageId } from '@/utils/page';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Parsed route state from URL.
 *
 * @property {PageId} page - The active visualization page
 * @property {string | null} subPageId - Sub-page filter ID (traffic page only)
 * @property {'node' | 'edge' | null} selectionType - Type of selected item
 * @property {string | null} selectionId - ID of selected item
 */
export interface RouteState {
  page: PageId;
  subPageId: string | null;
  selectionType: 'node' | 'edge' | null;
  selectionId: string | null;
}

/* ============================================================================
 * ROUTING FUNCTIONS
 * ============================================================================ */

/**
 * Parse URL pathname into route state.
 *
 * Extracts the page, optional sub-page filter, and optional selection from the URL.
 * Returns default values for invalid or missing segments.
 *
 * URL formats:
 * - /{page}                              - Page only
 * - /{page}/n/{nodeId}                   - Node selection
 * - /{page}/e/{edgeId}                   - Edge selection
 * - /traffic/{subPageId}/                - Traffic with sub-page filter
 * - /traffic/{subPageId}/n/{nodeId}      - Traffic with sub-page + node selection
 * - /traffic/{subPageId}/e/{edgeId}      - Traffic with sub-page + edge selection
 *
 * Disambiguation: 'n' and 'e' are reserved for selection prefixes.
 * Any other segment after page (on traffic) is treated as subPageId.
 *
 * @param {string} pathname - URL pathname (e.g., "/traffic/flow_dns/n/srv1")
 * @returns {RouteState} Parsed route state
 *
 * @example
 * parseRoute('/physical');
 * // Returns: { page: 'physical', subPageId: null, selectionType: null, selectionId: null }
 *
 * parseRoute('/physical/n/router1');
 * // Returns: { page: 'physical', subPageId: null, selectionType: 'node', selectionId: 'router1' }
 *
 * parseRoute('/traffic/flow_dns/');
 * // Returns: { page: 'traffic', subPageId: 'flow_dns', selectionType: null, selectionId: null }
 *
 * parseRoute('/traffic/flow_dns/n/dns-srv');
 * // Returns: { page: 'traffic', subPageId: 'flow_dns', selectionType: 'node', selectionId: 'dns-srv' }
 */
export function parseRoute(pathname: string): RouteState {
  /* Split pathname into segments, filtering out empty strings */
  const segments = pathname.split('/').filter(Boolean);

  /* Default values */
  let page: PageId = 'physical';
  let subPageId: string | null = null;
  let selectionType: 'node' | 'edge' | null = null;
  let selectionId: string | null = null;

  /* Parse page from first segment */
  if (segments.length >= 1) {
    const candidate = segments[0];
    if (isPageId(candidate)) {
      page = candidate;
    }
  }

  /* For traffic page: check for subPageId in second segment */
  if (page === 'traffic' && segments.length >= 2) {
    const second = segments[1];

    if (second === 'n' || second === 'e') {
      /* No sub-page, direct selection: /traffic/n/{id} or /traffic/e/{id} */
      if (segments.length >= 3) {
        selectionType = second === 'n' ? 'node' : 'edge';
        selectionId = decodeURIComponent(segments[2]);
      }
    } else {
      /* Sub-page ID present: /traffic/{subPageId}/... */
      subPageId = decodeURIComponent(second);

      /* Check for selection after sub-page: /traffic/{subPageId}/n/{id} */
      if (segments.length >= 4) {
        const third = segments[2];
        if (third === 'n' && segments[3]) {
          selectionType = 'node';
          selectionId = decodeURIComponent(segments[3]);
        } else if (third === 'e' && segments[3]) {
          selectionType = 'edge';
          selectionId = decodeURIComponent(segments[3]);
        }
      }
    }
  } else if (segments.length >= 3) {
    /* Non-traffic pages: standard selection parsing */
    const typeSegment = segments[1];
    const idSegment = segments[2];

    if (typeSegment === 'n' && idSegment) {
      selectionType = 'node';
      selectionId = decodeURIComponent(idSegment);
    } else if (typeSegment === 'e' && idSegment) {
      selectionType = 'edge';
      selectionId = decodeURIComponent(idSegment);
    }
  }

  return { page, subPageId, selectionType, selectionId };
}

/**
 * Build URL path from route components.
 *
 * Constructs a URL path string from page, optional sub-page filter, and selection.
 * IDs are URL-encoded to handle special characters.
 *
 * @param {PageId} page - The visualization page
 * @param {string | null} [subPageId] - Sub-page ID (traffic page only)
 * @param {'node' | 'edge' | null} [selectionType] - Type of selection
 * @param {string | null} [selectionId] - ID of selected item
 * @returns {string} URL path string
 *
 * @example
 * buildPath('physical');
 * // Returns: "/physical"
 *
 * buildPath('physical', null, 'node', 'router-1');
 * // Returns: "/physical/n/router-1"
 *
 * buildPath('traffic', 'flow_dns');
 * // Returns: "/traffic/flow_dns"
 *
 * buildPath('traffic', 'flow_dns', 'node', 'dns-srv');
 * // Returns: "/traffic/flow_dns/n/dns-srv"
 *
 */
export function buildPath(
  page: PageId,
  subPageId?: string | null,
  selectionType?: 'node' | 'edge' | null,
  selectionId?: string | null
): string {
  const parts: string[] = [page];

  /* Add sub-page segment for traffic page */
  if (page === 'traffic' && subPageId) {
    parts.push(encodeURIComponent(subPageId));
  }

  /* Add selection segments */
  if (selectionType && selectionId) {
    const prefix = selectionType === 'node' ? 'n' : 'e';
    parts.push(prefix, encodeURIComponent(selectionId));
  }

  return '/' + parts.join('/');
}

/**
 * Navigate to a new route, updating browser history.
 *
 * Uses the History API to update the URL without a page reload.
 * Can either push a new history entry or replace the current one.
 *
 * @param {PageId} page - The visualization page to navigate to
 * @param {string | null} [subPageId] - Sub-page ID for traffic page filtering
 * @param {'node' | 'edge' | null} [selectionType] - Type of selection
 * @param {string | null} [selectionId] - ID of selected item
 * @param {boolean} [isHistoryReplace=false] - If true, replace history entry instead of push
 *
 * @example
 * // Navigate to physical page (adds to history)
 * navigateTo('physical');
 *
 * // Navigate with selection
 * navigateTo('physical', null, 'node', 'router1');
 *
 * // Navigate to traffic page with sub-page filter
 * navigateTo('traffic', 'flow_dns');
 *
 * // Navigate to traffic with sub-page and selection
 * navigateTo('traffic', 'flow_dns', 'node', 'dns-srv');
 *
 * // Replace current history entry (useful for initial redirect)
 * navigateTo('physical', null, null, null, true);
 */
export function navigateTo(
  page: PageId,
  subPageId?: string | null,
  selectionType?: 'node' | 'edge' | null,
  selectionId?: string | null,
  isHistoryReplace = false
): void {
  /* Preserve current subPageId if not explicitly provided */
  let resolvedSubPageId = subPageId;
  if (subPageId === undefined) {
    const currentRoute = parseRoute(window.location.pathname);
    resolvedSubPageId = currentRoute.subPageId;
  }

  /* Build the URL path */
  const path = buildPath(page, resolvedSubPageId, selectionType, selectionId);

  /* Update browser history */
  if (isHistoryReplace) {
    history.replaceState(null, '', path);
  } else {
    history.pushState(null, '', path);
  }
}

/* ============================================================================
 * NAVIGATION HELPERS
 * Higher-level functions that use current route context automatically.
 * ============================================================================ */

/**
 * Navigate to a page, clearing selection but preserving sub-page on same page.
 *
 * @param {PageId} page - The page to navigate to
 */
export function navigateToPage(page: PageId): void {
  const current = parseRoute(window.location.pathname);
  /* Preserve subPageId only if staying on same page */
  const subPageId = current.page === page ? current.subPageId : null;
  navigateTo(page, subPageId, null, null);
}

/**
 * Navigate to a sub-page (traffic page only), clearing selection.
 *
 * @param {string | null} subPageId - Sub-page ID, or null to clear
 */
export function navigateToSubPage(subPageId: string | null): void {
  const current = parseRoute(window.location.pathname);
  navigateTo(current.page, subPageId, null, null);
}

/**
 * Select a node on the current page, preserving sub-page.
 *
 * @param {string} nodeId - Node ID to select
 */
export function navigateToNode(nodeId: string): void {
  const current = parseRoute(window.location.pathname);
  navigateTo(current.page, current.subPageId, 'node', nodeId);
}

/**
 * Select an edge on the current page, preserving sub-page.
 *
 * @param {string} edgeId - Edge ID to select
 */
export function navigateToEdge(edgeId: string): void {
  const current = parseRoute(window.location.pathname);
  navigateTo(current.page, current.subPageId, 'edge', edgeId);
}

/**
 * Clear selection on the current page, preserving sub-page.
 */
export function clearSelection(): void {
  const current = parseRoute(window.location.pathname);
  navigateTo(current.page, current.subPageId, null, null);
}
