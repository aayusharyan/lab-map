/**
 * @file index.ts
 * @description Barrel export for edge type utilities
 *
 * Public API:
 * - Constants:
 *   - EDGE_TYPES
 * - Helpers:
 *   - isEdgeType
 *   - getEdgeTypeOrThrow
 *   - toVisEdgeColor
 * - Types:
 *   - EdgeType
 *   - EdgeTypeId
 *
 * Import style:
 * import { EDGE_TYPES, isEdgeType, type EdgeType } from '@/utils/edgeType';
 */

export {
  EDGE_TYPES,
  isEdgeType,
  getEdgeTypeOrThrow,
  toVisEdgeColor,
} from './edgeType';
export type { EdgeType } from './edgeType.types';
export type { EdgeTypeId } from './edgeType';
