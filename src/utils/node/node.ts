/**
 * @file node.ts
 * @description Node attribute helpers for lookup and UI rendering
 *
 * This module contains small, reusable helpers for working with the
 * `Node.attributes`, `Node.subSections[*].attributes`, `Node.sections[*].attributes`,
 * and `Node.sections[*].subSections[*].attributes` arrays defined in
 * `node.types.ts`.
 *
 * Responsibility:
 * 1. Flatten attribute bags into stable key/value rows for UI components
 *
 * Non-goals:
 * - No schema validation
 * - No page-specific formatting
 * - No data loading/parsing side effects
 *
 * @see node.types.ts - Canonical `Node` and `NodeAttribute` contracts
 * @see src/components/sidebar/SidebarNode.tsx - Section/attribute rendering
 * @see src/components/sidebar/SidebarEdge.tsx - Endpoint attribute lookup
 * @see src/components/views/graphView/GraphView.tsx - VLAN attribute lookups
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import type { NodeAttribute } from './node.types';

/* ============================================================================
 * PUBLIC HELPERS
 * ============================================================================ */

/**
 * Flatten attribute bags into render-ready rows.
 *
 * This is primarily used by UI code that needs simple ordered rows for
 * key/value rendering (for example `PropRow` in sidebar components).
 *
 * Filtering rules:
 * - Excludes empty string values (`''`)
 * - Excludes sentinel unknown values (`'unknown'`)
 *
 * @param {NodeAttribute[] | undefined} attrs - Attribute bags
 * @returns {Array<{ key: string; value: string }>} Flat rows in source order
 *
 * @example
 * const rows = flattenAttributes(node.attributes);
 * rows.forEach(({ key, value }) => console.log(key, value));
 */
export function flattenAttributes(attrs: NodeAttribute[] | undefined): Array<{ key: string; value: string }> {
  if (!Array.isArray(attrs)) return [];

  const rows: Array<{ key: string; value: string }> = [];
  attrs.forEach(bag => {
    Object.entries(bag).forEach(([k, v]) => {
      if (v !== '' && v !== 'unknown') rows.push({ key: k, value: v });
    });
  });
  return rows;
}
