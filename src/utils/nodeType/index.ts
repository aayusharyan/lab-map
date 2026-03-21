/**
 * @file index.ts
 * @description Barrel export for node type utilities
 *
 * Public API:
 * - Constants:
 *   - NODE_TYPES
 *   - DEFAULT_NODE_TYPE_KEY
 * - Helpers:
 *   - resolveNodeType
 *   - getNodeThemeColor
 *   - toVisNodeColor
 *   - buildNodeFont
 * - Types:
 *   - NodeType
 *
 * Import style:
 * import { NODE_TYPES, toVisNodeColor, type NodeType } from '@/utils/nodeType';
 */

export {
  NODE_TYPES,
  DEFAULT_NODE_TYPE_KEY,
  resolveNodeType,
  getNodeThemeColor,
  toVisNodeColor,
  buildNodeFont
} from './nodeType';
export type { NodeType } from './nodeType.types';
