/**
 * @file index.ts
 * @description Barrel export for node type utilities
 *
 * Public API:
 * - Constants:
 *   - NODE_TYPES
 *   - NODE_TYPE_IDS
 * - Helpers:
 *   - isNodeType
 *   - getNodeTypeOrThrow
 *   - getNodeThemeColor
 *   - toVisNodeColor
 *   - buildNodeFont
 * - Types:
 *   - NodeType
 *   - NodeTypeId
 *
 * Import style:
 * import { NODE_TYPES, toVisNodeColor, type NodeType } from '@/utils/nodeType';
 */

export {
  NODE_TYPES,
  NODE_TYPE_IDS,
  isNodeType,
  getNodeTypeOrThrow,
  getNodeThemeColor,
  toVisNodeColor,
  buildNodeFont
} from './nodeType';
export type { NodeType } from './nodeType.types';
export type { NodeTypeId } from './nodeType';
