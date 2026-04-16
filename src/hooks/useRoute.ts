/**
 * @file useRoute.ts
 * @description Central routing hook for URL-based state
 *
 * This hook is the single source of truth for URL-based routing, providing:
 * - Full route state: page, subPageId, selectionType, selectionId
 * - Root redirect: handled by RouteProvider
 * - History sync: handled by RouteProvider (patches history exactly once)
 *
 * URL Structure:
 * - /{page}                             - Page only (e.g., /physical, /traffic)
 * - /{page}/n/{nodeId}                  - Page with selected node
 * - /{page}/e/{edgeId}                  - Page with selected edge
 * - /traffic/{subPageId}/               - Traffic page with sub-page filter
 * - /traffic/{subPageId}/n/{nodeId}     - Traffic with sub-page + node
 * - /traffic/{subPageId}/e/{edgeId}     - Traffic with sub-page + edge
 *
 * @example
 * import { useRoute } from '@/hooks/useRoute';
 *
 * function MyComponent() {
 *   const { page, subPageId } = useRoute();
 *   // Destructure only what you need
 * }
 *
 * @see RouteContext.tsx - Provider that patches history and exposes route state
 * @see routing.ts - URL parsing and navigation utilities
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useContext } from 'react';

import { RouteContext } from '@/context/RouteContext';
import type { RouteState } from '@/utils/routing';

/* ============================================================================
 * HOOK IMPLEMENTATION
 * ============================================================================ */

/**
 * Central routing hook for URL-based state.
 *
 * Reads from RouteContext which is updated by a single RouteProvider that
 * patches history.pushState/replaceState exactly once. All components calling
 * this hook share the same route state with no duplicate history patches.
 *
 * Returns the full route state parsed from the URL:
 * - page: Current page (physical, traffic, vlan)
 * - subPageId: Sub-page filter for traffic page (null = all)
 * - selectionType: Type of selected item (node, edge, or null)
 * - selectionId: ID of selected item (or null)
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
  return useContext(RouteContext);
}
