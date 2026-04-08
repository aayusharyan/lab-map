/**
 * @file edge.ts
 * @description Edge attribute helpers for lookup and UI rendering
 *
 * This module contains small, reusable helpers for working with
 * `Edge.attributes` arrays defined in `edge.types.ts`.
 *
 * Responsibility:
 * 1. Flatten edge attribute bags into stable key/value rows for UI components
 *
 * Non-goals:
 * - No schema validation
 * - No page-specific formatting
 * - No data loading/parsing side effects
 *
 * @see edge.types.ts - Canonical `Edge` and `EdgeAttribute` contracts
 * @see src/components/sidebar/Sidebar.tsx - Edge sidebar attribute display
 */

import type { EdgeAttribute } from './edge.types';

/**
 * Flatten attribute bags into render-ready rows.
 *
 * This is primarily used by UI code that needs simple ordered rows for
 * key/value rendering.
 *
 * Filtering rules:
 * - Excludes empty string values (`''`)
 * - Excludes sentinel unknown values (`'unknown'`)
 *
 * @param {EdgeAttribute[] | undefined} attrs - Attribute bags
 * @returns {Array<{ key: string; value: string }>} Flat rows in source order
 *
 * @example
 * const rows = flattenEdgeAttributes(edge.attributes);
 * rows.forEach(({ key, value }) => console.log(key, value));
 */
export function flattenEdgeAttributes(attrs: EdgeAttribute[] | undefined): Array<{ key: string; value: string }> {
  if (!Array.isArray(attrs)) return [];

  const rows: Array<{ key: string; value: string }> = [];
  attrs.forEach(bag => {
    Object.entries(bag).forEach(([k, v]) => {
      if (v !== '' && v !== 'unknown') rows.push({ key: k, value: v });
    });
  });
  return rows;
}
