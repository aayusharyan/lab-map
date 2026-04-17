/**
 * @file node.types.ts
 * @description Canonical Node contracts shared across Lab Map
 *
 * This file defines the base node contracts used across Lab Map views.
 * It intentionally keeps:
 * - identity strict (`id`, `type`, `label`)
 * - payload structure flexible (`attributes`, `subSections`, `sections`)
 *
 * Design goals:
 * 1. Ensure every node uses a valid canonical node type (`NodeTypeId`)
 * 2. Allow multiple attribute bags at node/section/sub-section level
 * 3. Keep explicit hierarchy while allowing direct shortcuts:
 *    - node -> attributes
 *    - node -> subSections -> attributes
 *    - node -> sections -> attributes
 *    - node -> sections -> subSections -> attributes
 *
 * Contributor notes:
 * - Treat these exports as shared contracts used by multiple modules.
 * - Prefer additive changes to preserve compatibility with existing data files.
 * - Keep examples and property docs in sync with the actual type definitions.
 *
 * @see src/utils/nodeType/nodeType.ts - Source of canonical `NodeTypeId` values
 * @see src/utils/page/page.types.ts - PageData uses RawNode[]
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
 * Node sub-section model.
 *
 * A sub-section maps to one table in the sidebar/tooltip model.
 * Attributes define the row data within that table.
 *
 * Key conventions:
 * - `key` should be stable and machine-friendly (e.g. `nics`, `storage`)
 * - `label` should be human-friendly (e.g. `Hardware`, `Network`)
 *
 * @property {string} key - Stable section identifier
 * @property {string} label - Human-readable section label
 * @property {NodeAttribute[]} [attributes] - Optional section attributes
 *
 * @example
 * const subSection: NodeSubSection = {
 *   key: 'nics',
 *   label: 'NICs',
 *   attributes: [{ cpu: 'AMD EPYC 7452' }, { ram: '256GB' }],
 * };
 */
export interface NodeSubSection {
  key: string;
  label: string;
  attributes?: NodeAttribute[];
}

/* ============================================================================
 * CANONICAL NODE MODEL
 * ============================================================================ */

/**
 * Node section model.
 *
 * A section is a higher-level container used for visual separation/grouping.
 * Each section contains zero or more sub-sections. Sub-sections render tables.
 *
 * @property {string} key - Stable section identifier
 * @property {string} label - Human-readable section label
 * @property {NodeAttribute[]} [attributes] - Optional section-level attributes
 * @property {NodeSubSection[]} [subSections] - Optional sub-sections
 */
export interface NodeSection {
  key: string;
  label: string;
  attributes?: NodeAttribute[];
  subSections?: NodeSubSection[];
}

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
 * - `subSections`: node-level sub-section tables
 * - `sections`: grouped section list (with optional section and sub-section tables)
 *
 * This base contract is routing-friendly (`id` required) and payload-driven
 * via `attributes`, `subSections`, and `sections`.
 *
 * @property {string} id - Unique node ID used by URL routing and edge refs
 * @property {NodeTypeId} type - Canonical node type identifier
 * @property {string} label - Display label used in UI
 * @property {NodeAttribute[]} [attributes] - Node-level attribute bags
 * @property {NodeSubSection[]} [subSections] - Optional node-level sub-sections
 * @property {NodeSection[]} [sections] - Optional grouped sections
 *
 * @example
 * const node: Node = {
 *   id: 'k3s-master-01',
 *   type: 'server-rack-1u-compute-1',
 *   label: 'k3s-master-01',
 *   attributes: [{ ip: '10.0.10.11' }, { role: 'Control Plane' }],
 *   subSections: [{ key: 'services', label: 'Services', attributes: [{ dns: 'CoreDNS' }] }],
 *   sections: [
 *     {
 *       key: 'hardware',
 *       label: 'Hardware',
 *       attributes: [{ model: 'R730' }],
 *       subSections: [
 *         { key: 'details', label: 'Details', attributes: [{ cpu: 'Ryzen 9' }, { ram: '64GB' }] },
 *       ],
 *     },
 *   ],
 * };
 */
export interface Node {
  id: string;
  type: NodeTypeId;
  label: string;
  attributes?: NodeAttribute[];
  subSections?: NodeSubSection[];
  sections?: NodeSection[];
}

/**
 * Node as loaded from data files.
 *
 * This is the "raw" node structure before vis-network styling is applied.
 * Matches the structure defined in JSON schema files.
 *
 * Extends `Node` with traffic flow references and an escape hatch for
 * legacy `meta` payloads (normalised into `attributes`/`sections` at load time).
 *
 * @property {string[]} [flows] - Traffic flow IDs (traffic page)
 * @property {string} [_flowNodeId] - Internal: original node ID in flow mode
 * @property {string} [_flowLabel] - Internal: original label in flow mode
 * @property {Record<string, unknown>} [meta] - Legacy metadata; normalised on load
 *
 * @see src/utils/data.ts - normalizeLegacyNodeShape() consumes `meta`
 * @see src/utils/page/page.types.ts - PageData uses RawNode[]
 */
export interface RawNode extends Node {
  flows?: string[];
  _flowNodeId?: string;
  _flowLabel?: string;
  /** @deprecated Legacy payload; normalized into attributes/sections at load time. */
  meta?: Record<string, unknown>;
}
