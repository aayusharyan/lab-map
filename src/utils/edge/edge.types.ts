/**
 * @file edge.types.ts
 * @description Canonical Edge contracts shared across Lab Map views
 *
 * This file defines the base edge contracts used across Lab Map views.
 * It intentionally keeps:
 * - identity strict (`id`, `from`, `to`, `type`)
 * - payload structure flexible (`label`, `attributes`, `subSections`, `sections`)
 *
 * Design goals:
 * 1. Ensure every edge uses a valid canonical edge type (`EdgeTypeId`)
 * 2. Keep endpoint structure explicit (`from`/`to` with optional `port`)
 * 3. Allow attribute bags at edge/section/sub-section levels for flexible UI rendering
 * 4. Keep hierarchy explicit while allowing direct shortcuts:
 *    - edge -> attributes
 *    - edge -> subSections -> attributes
 *    - edge -> sections -> attributes
 *    - edge -> sections -> subSections -> attributes
 *
 * Contributor notes:
 * - Treat these exports as shared contracts used by multiple modules.
 * - Prefer additive changes to preserve compatibility with existing data files.
 * - Keep examples and property docs in sync with the actual type definitions.
 *
 * @see src/utils/edgeType/edgeType.ts - Source of canonical `EdgeTypeId` values
 * @see src/utils/page/page.types.ts - PageData uses RawEdge[]
 * @see src/utils/page/page.ts - Edge rendering/transformation pipeline
 */

import type { EdgeTypeId } from '@/utils/edgeType';

/**
 * Edge attribute bag.
 *
 * Represents one logical set of key/value metadata attached to an edge.
 * Multiple bags can be attached to preserve ordering and grouping intent.
 *
 * Contract:
 * - Keys are attribute names (`mtu`, `fromLabel`, `toName`, etc.)
 * - Values are display-safe strings
 *
 * @example
 * const edgeMeta: EdgeAttribute = {
 *   fromLabel: 'Core SW Uplink',
 *   toLabel: 'Firewall WAN',
 * };
 */
export type EdgeAttribute = Record<string, string>;

/**
 * Canonical edge endpoint.
 *
 * `nodeId` is required for graph connectivity and routing.
 * `port` is optional and should be shown only when present.
 *
 * @property {string} nodeId - Canonical node identifier referenced by the edge
 * @property {string} [port] - Optional endpoint port/interface label
 *
 * @example
 * const endpoint: EdgeEndpoint = {
 *   nodeId: 'core-sw-01',
 *   port: 'Gi1/0/48',
 * };
 */
export interface EdgeEndpoint {
  nodeId: string;
  port?: string;
}

/**
 * Edge sub-section model.
 *
 * A sub-section maps to one table in edge sidebar/tooltip rendering.
 *
 * Key conventions:
 * - `key` should be stable and machine-friendly (e.g. `qos`, `routing`)
 * - `label` should be human-friendly (e.g. `QoS`, `Routing`)
 *
 * @property {string} key - Stable sub-section identifier
 * @property {string} label - Human-readable sub-section label
 * @property {EdgeAttribute[]} [attributes] - Optional sub-section attributes
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
 *
 * @property {string} key - Stable section identifier
 * @property {string} label - Human-readable section label
 * @property {EdgeAttribute[]} [attributes] - Optional section-level attributes
 * @property {EdgeSubSection[]} [subSections] - Optional nested sub-sections
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
 * - `from`: source endpoint (`nodeId` + optional `port`)
 * - `to`: target endpoint (`nodeId` + optional `port`)
 * - `type`: canonical type from `EdgeTypeId`
 *
 * Optional:
 * - `label`: display label in UI
 * - `attributes`: custom key/value metadata bags
 * - `subSections`: edge-level sub-sections
 * - `sections`: grouped edge sections
 *
 * This base contract is routing-friendly (`from.nodeId`/`to.nodeId` required)
 * and payload-driven via `attributes`, `subSections`, and `sections`.
 *
 * @property {string} id - Unique edge ID used by graph state and selection
 * @property {EdgeEndpoint} from - Source endpoint descriptor
 * @property {EdgeEndpoint} to - Target endpoint descriptor
 * @property {EdgeTypeId} type - Canonical edge type identifier
 * @property {string} [label] - Optional edge label for UI display
 * @property {EdgeAttribute[]} [attributes] - Edge-level attribute bags
 * @property {EdgeSubSection[]} [subSections] - Optional edge-level sub-sections
 * @property {EdgeSection[]} [sections] - Optional grouped edge sections
 *
 * @example
 * const edge: Edge = {
 *   id: 'core-to-fw',
 *   from: { nodeId: 'core-sw-01', port: 'Gi1/0/48' },
 *   to: { nodeId: 'fw-01', port: 'eth0' },
 *   type: 'trunk',
 *   label: 'Uplink',
 *   attributes: [{ speed: '10G' }],
 * };
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

/**
 * Edge-specific metadata.
 *
 * Contains additional information about network connections.
 * Typically populated from JSON data and used for tooltip display.
 *
 * @property {string[]} [allowed] - Allowed VLAN IDs on this link
 * @property {string} [denied] - Denied traffic types
 */
export interface EdgeMeta {
  allowed?: string[];
  denied?: string;
}

/**
 * Edge as loaded from data files.
 *
 * This is the "raw" edge structure before vis-network styling is applied.
 * Matches the structure defined in JSON schema files.
 *
 * Extends `Edge` with physical/application properties, traffic flow references,
 * and legacy compatibility fields.
 *
 * Physical Properties:
 * @property {string} [speed] - Link speed (e.g. "10G")
 * @property {string} [cable] - Cable type (e.g. "fiber")
 * @property {string} [cableColor] - Physical cable color
 * @property {string} [category] - Cable category (e.g. "Cat6")
 * @property {string} [vlans] - Allowed VLANs on this link
 *
 * Application Properties:
 * @property {boolean} [tls] - TLS encryption enabled
 * @property {string} [tlsTermination] - TLS termination point
 * @property {string} [port] - Application port
 * @property {string} [protocol] - Protocol (e.g. "HTTP", "HTTPS")
 * @property {string[]} [domains] - Associated domains
 * @property {string} [note] - Additional notes
 *
 * Traffic / Internal:
 * @property {string[]} [flows] - Traffic flow IDs (traffic page)
 * @property {string} [arrows] - Arrow direction (vis-network)
 * @property {string} [_flowLabel] - Internal: original label in flow mode
 * @property {RawEdge} [_raw] - Internal: original edge before transformation
 *
 * Legacy (deprecated):
 * @property {string} [fromPort] - Legacy field; use `from.port` instead
 * @property {string} [toPort] - Legacy field; use `to.port` instead
 *
 * @see src/utils/page/page.types.ts - PageData uses RawEdge[]
 * @see src/utils/data.ts - normalizeLegacyEdgeShape() processes fromPort/toPort
 */
export interface RawEdge extends Edge {
  flows?: string[];
  arrows?: string;
  /** @deprecated Legacy field; use `from.port`. */
  fromPort?: string;
  /** @deprecated Legacy field; use `to.port`. */
  toPort?: string;
  speed?: string;
  cable?: string;
  cableColor?: string;
  category?: string;
  vlans?: string;
  tls?: boolean;
  tlsTermination?: string;
  port?: string;
  protocol?: string;
  domains?: string[];
  note?: string;
  meta?: EdgeMeta;
  _raw?: RawEdge;
  _flowLabel?: string;
}
