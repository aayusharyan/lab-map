/**
 * @file node.ts
 * @description Canonical Node contracts shared across Lab Map
 *
 * This file defines the base node contracts used across Lab Map data models,
 * including graph and layout views.
 * It intentionally keeps:
 * - identity strict (`type`, `label`)
 * - payload structure flexible (`attributes`, `sections`)
 *
 * Design goals:
 * 1. Ensure every node uses a valid canonical node type (`NodeTypeId`)
 * 2. Allow multiple attribute bags at both node and section level
 * 3. Keep section groupings explicit for UI rendering (sidebar/tooltips)
 *
 * Contributor notes:
 * - Treat these exports as shared contracts used by multiple modules.
 * - Prefer additive changes to preserve compatibility with existing data files.
 * - Keep examples and property docs in sync with the actual type definitions.
 *
 * @see src/utils/nodeType/nodeType.ts - Source of canonical `NodeTypeId` values
 * @see src/types/topology.ts - `RawNode` extends `Node`
 * @see src/utils/page/page.ts - Node rendering/transformation pipeline
 */

import type { NodeTypeId } from '@/utils/nodeType';

/* ============================================================================
 * BASE EXTENSION TYPES
 * ============================================================================ */

/**
 * Node attribute bag.
 *
 * Represents one logical set of key/value metadata.
 * Multiple bags can be attached to a node or section via arrays.
 *
 * Contract:
 * - Keys are attribute names (`cpu`, `mac`, `gateway`, etc.)
 * - Values are display-safe strings
 *
 * @example
 * const hardware: NodeAttribute = {
 *   cpu: 'Intel Xeon E5-2680 v4',
 *   ram: '128GB',
 * };
 */
export type NodeAttribute = Record<string, string>;

/**
 * Node section model.
 *
 * A section groups related attributes under a stable key and readable label.
 * Typical examples are "Hardware", "Services", "Network", or "Storage".
 *
 * Key conventions:
 * - `key` should be stable and machine-friendly (e.g. `hardware`, `network`)
 * - `label` should be human-friendly (e.g. `Hardware`, `Network`)
 *
 * @property {string} key - Stable section identifier
 * @property {string} label - Human-readable section label
 * @property {NodeAttribute[]} [attributes] - Optional section attributes
 *
 * @example
 * const section: NodeSection = {
 *   key: 'hardware',
 *   label: 'Hardware',
 *   attributes: [{ cpu: 'AMD EPYC 7452' }, { ram: '256GB' }],
 * };
 */
export interface NodeSection {
  key: string;
  label: string;
  attributes?: NodeAttribute[];
}

/* ============================================================================
 * CANONICAL NODE MODEL
 * ============================================================================ */

/**
 * Canonical node model.
 *
 * Required:
 * - `id`: unique node identifier used for routing/selection
 * - `type`: canonical type from `NodeTypeId`
 * - `label`: display label
 *
 * Optional:
 * - `attributes`: node-level attribute bags
 * - `sections`: grouped section list
 *
 * This base contract is routing-friendly (`id` required) and payload-driven
 * via `attributes` and `sections`.
 *
 * @property {string} id - Unique node ID used by URL routing and edge refs
 * @property {NodeTypeId} type - Canonical node type identifier
 * @property {string} label - Display label used in UI
 * @property {NodeAttribute[]} [attributes] - Node-level attribute bags
 * @property {NodeSection[]} [sections] - Optional grouped sections
 *
 * @example
 * const node: Node = {
 *   id: 'k3s-master-01',
 *   type: 'server-rack-1u-compute-1',
 *   label: 'k3s-master-01',
 *   attributes: [{ ip: '10.0.10.11' }, { role: 'Control Plane' }],
 *   sections: [
 *     { key: 'hardware', label: 'Hardware', attributes: [{ cpu: 'Ryzen 9' }, { ram: '64GB' }] },
 *   ],
 * };
 */
export interface Node {
  id: string;
  type: NodeTypeId;
  label: string;
  attributes?: NodeAttribute[];
  sections?: NodeSection[];
}
