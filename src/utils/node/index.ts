/**
 * @file index.ts
 * @description Barrel export for node utilities and node contracts
 *
 * Public API:
 * - Helpers:
 *   - flattenAttributes
 * - Types:
 *   - Node
 *   - NodeAttribute
 *   - NodeSection
 *
 * Import style:
 * import { flattenAttributes, type Node } from '@/utils/node';
 */

export { flattenAttributes } from './node';
export type { Node, NodeAttribute, NodeSection } from './node.types';
