/**
 * @file index.ts
 * @description Barrel export for edge utilities and edge contracts
 *
 * This module provides the stable public entry-point for edge utilities.
 * Prefer importing from this barrel rather than deep module paths.
 *
 * Public API surface:
 * 1. Helpers:
 *    - flattenEdgeAttributes
 * 2. Types:
 *    - Edge
 *    - EdgeAttribute
 *    - EdgeEndpoint
 *    - EdgeSubSection
 *    - EdgeSection
 *    - EdgeMeta
 *    - RawEdge
 *
 * Design notes:
 * - Keep helper exports small and focused.
 * - Re-export core contracts used by data loading and UI rendering paths.
 * - Keep import ergonomics consistent across the codebase.
 *
 * @see edge.ts - Edge utility helpers
 * @see edge.types.ts - Canonical edge contract definitions
 * @see src/utils/page/page.types.ts - PageData wraps RawEdge[]
 *
 * Import style:
 * import { flattenEdgeAttributes, type Edge } from '@/utils/edge';
 */

export { flattenEdgeAttributes } from './edge';
export type { Edge, EdgeAttribute, EdgeEndpoint, EdgeSubSection, EdgeSection, EdgeMeta, RawEdge } from './edge.types';
