/**
 * @file index.ts
 * @description Barrel export for node utilities and node contracts
 *
 * This module provides the stable public entry-point for node utilities.
 * Prefer importing from this barrel rather than deep module paths.
 *
 * Public API surface:
 * 1. Helpers:
 *    - flattenAttributes
 * 2. Types:
 *    - Node
 *    - NodeAttribute
 *    - NodeSubSection
 *    - NodeSection
 *
 * Design notes:
 * - Keep helper exports small and focused.
 * - Re-export core contracts used by data loading and UI rendering paths.
 * - Keep import ergonomics consistent across the codebase.
 *
 * @see node.ts - Node utility helpers
 * @see node.types.ts - Canonical node contract definitions
 * @see src/types/topology.ts - Raw topology contracts extending Node
 *
 * Import style:
 * import { flattenAttributes, type Node } from '@/utils/node';
 */

export { flattenAttributes } from './node';
export type { Node, NodeAttribute, NodeSubSection, NodeSection } from './node.types';
