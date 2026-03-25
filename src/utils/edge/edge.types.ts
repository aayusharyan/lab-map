/**
 * @file edge.types.ts
 * @description Canonical Edge contracts shared across Lab Map views
 *
 * This file defines the base edge contracts used across Lab Map views.
 * It intentionally keeps:
 * - identity strict (`id`, `from`, `to`, `type`)
 * - payload structure flexible (`label`, `attributes`, `subSections`, `sections`)
 *
 * @see src/utils/edgeType/edgeType.ts - Source of canonical `EdgeTypeId` values
 * @see src/types/topology.ts - `RawEdge` extends `Edge`
 */

import type { EdgeTypeId } from '@/utils/edgeType';

/**
 * Edge attribute bag.
 *
 * Represents one logical set of key/value metadata attached to an edge.
 * Multiple bags can be attached to preserve ordering and grouping intent.
 */
export type EdgeAttribute = Record<string, string>;

/**
 * Canonical edge endpoint.
 *
 * `nodeId` is required for graph connectivity and routing.
 * `port` is optional and should be shown only when present.
 */
export interface EdgeEndpoint {
  nodeId: string;
  port?: string;
}

/**
 * Edge sub-section model.
 *
 * A sub-section maps to one table in edge sidebar/tooltip rendering.
 */
export interface EdgeSubSection {
  key: string;
  label: string;
  attributes?: EdgeAttribute[];
}

/**
 * Edge section model.
 *
 * A section is a visual grouping container and may have attributes directly
 * or nested sub-sections.
 */
export interface EdgeSection {
  key: string;
  label: string;
  attributes?: EdgeAttribute[];
  subSections?: EdgeSubSection[];
}

/**
 * Canonical edge model.
 *
 * Required:
 * - `id`: unique edge identifier
 * - `from`: source node id
 * - `to`: target node id
 * - `type`: canonical type from `EdgeTypeId`
 *
 * Optional:
 * - `label`: display label in UI
 * - `attributes`: custom key/value metadata bags
 * - `subSections`: edge-level sub-sections
 * - `sections`: grouped edge sections
 */
export interface Edge {
  id: string;
  from: EdgeEndpoint;
  to: EdgeEndpoint;
  type: EdgeTypeId;
  label?: string;
  attributes?: EdgeAttribute[];
  subSections?: EdgeSubSection[];
  sections?: EdgeSection[];
}
