/**
 * @file page.ts
 * @description Page navigation utilities and data transformation
 *
 * This file contains page navigation configuration and utility functions for
 * transforming raw JSON topology data into vis-network compatible format.
 * It handles page-specific label generation, HTML tooltip creation, and
 * visual styling.
 *
 * Exports:
 * - PAGES: Canonical page registry keyed by page ID
 * - PAGE_IDS: Canonical list of all registry keys
 * - isPageId: Type guard for PageId validation
 * - buildPageDataOrThrow: Transform raw data to vis-network format
 * - makeTitleEl: Create DOM element for tooltips
 *
 * Transformation Pipeline:
 * 1. Raw JSON data loaded from files (RawNode, RawEdge)
 * 2. buildPageDataOrThrow() called with page ID
 * 3. Nodes styled with iconURL, colors, labels, tooltips
 * 4. Edges styled with colors, widths, dash patterns, tooltips
 * 5. Returns vis-network compatible objects with _raw reference
 *
 * @see page.types.ts - Canonical Page/PageId models
 * @see nodeType.ts - Canonical node type registry and style helpers
 * @see edgeType.ts - Canonical edge type registry and style helpers
 * @see GraphView.tsx - Applies transformed data to vis-network
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import type { RawEdge } from '@/utils/edge';
import type { RawNode } from '@/utils/node';


import { getEdgeTypeOrThrow, toVisEdgeColor } from '../edgeType';
import { flattenAttributes } from '../node';
import { getNodeTypeOrThrow, getNodeThemeColor, toVisNodeColor, buildNodeFont } from '../nodeType';

import type { Page, PageId } from './page.types';

/* ============================================================================
 * PAGE NAVIGATION
 * Tab configuration and page ID utilities for routing and UI
 * ============================================================================ */

/**
 * Keep the runtime registry as the source of truth and derive PAGE_IDS from it.
 * This keeps UI option order and type-safe ID iteration aligned with page config.
 */
const definePages = <T extends Record<PageId, Page>>(pages: T) => pages;

/** Canonical page registry keyed by page ID. */
const PAGES_MAP = definePages({
  physical: { id: 'physical', label: 'Physical', title: 'LAN cables, switch ports, hardware specs' },
  traffic: { id: 'traffic', label: 'Traffic / Services', title: 'Domain routing, Traefik, service config' },
  vlan: { id: 'vlan', label: 'VLAN Segmentation', title: 'VLAN segments, membership, inter-VLAN ACL rules' },
});

/** Canonical page IDs and registry exports. */
export const PAGES: Record<PageId, Page> = PAGES_MAP;
export const PAGE_IDS = Object.keys(PAGES_MAP) as PageId[];

/**
 * Type guard to validate if a string is a valid PageId.
 *
 * @param {string} value - String to validate
 * @returns {boolean} True if value is a valid PageId
 */
export function isPageId(value: string): value is PageId {
  return Object.prototype.hasOwnProperty.call(PAGES_MAP, value);
}

/* ============================================================================
 * LABEL GENERATION
 * ============================================================================ */

/**
 * Build the display label for a node.
 *
 * Currently returns `node.label` directly. Exists as a named helper so
 * per-page label overrides can be added here without touching call sites.
 *
 * @param {RawNode} node - Raw node from topology data
 * @param {PageId} _page - Active page ID (reserved for future per-page labels)
 * @returns {string} Display label rendered on the graph node
 */
function buildLabel(node: RawNode, _page: PageId): string {
  return node.label;
}

/**
 * Build a short port-hint string for an edge tooltip (e.g., `"eth0 ↔ lan1"`).
 *
 * Returns `undefined` when neither endpoint has a port configured, so callers
 * can omit the hint row entirely rather than rendering an empty line.
 *
 * @param {Pick<RawEdge, 'from' | 'to'>} edge - Edge with endpoint port data
 * @returns {string | undefined} Port hint string, or undefined when no ports are set
 */
function getEdgePortHint(edge: Pick<RawEdge, 'from' | 'to'>): string | undefined {
  const fromPort = edge.from.port;
  const toPort = edge.to.port;
  if (!fromPort && !toPort) return undefined;
  if (fromPort && toPort) return `${fromPort} ↔ ${toPort}`;
  return fromPort || toPort;
}

/**
 * Build the display label shown on an edge in the graph.
 *
 * Combines the edge's `label` field with a port-hint (e.g., `"eth0 ↔ lan1"`),
 * joined by `separator`. When only one is present, returns that value alone.
 *
 * @param {Pick<RawEdge, 'label' | 'from' | 'to'>} edge - Edge with label and endpoint data
 * @param {string} [separator='\n'] - String placed between label and port hint
 * @returns {string} Combined display label for the edge
 */
function getEdgeDisplayLabel(edge: Pick<RawEdge, 'label' | 'from' | 'to'>, separator: string = '\n'): string {
  const base = edge.label || '';
  const hint = getEdgePortHint(edge);
  if (!hint) return base;
  if (!base) return hint;
  return `${base}${separator}${hint}`;
}

/* ============================================================================
 * TOOLTIP GENERATION
 * ============================================================================ */

/**
 * Build an HTML tooltip element for a node.
 *
 * Constructs a structured `vis-tt` HTML string containing the node's label,
 * ID, page name, and top-level attributes.
 * Uses the node's accent color (dark theme) as the tooltip header border color.
 *
 * Returns the result wrapped in a DOM element via `makeTitleEl()` so
 * vis-network can attach it as a native tooltip.
 *
 * @param {RawNode} node - Raw node from topology data
 * @param {PageId} page - Active page ID (shown as a metadata row in the tooltip)
 * @returns {HTMLElement | null} Tooltip DOM element, or null if construction fails
 */
function buildTitleOrThrow(node: RawNode, page: PageId): HTMLElement | null {
  const tt = (rows: string) => `<div class="vis-tt">${rows}</div>`;
  const row = (k: string, v: string | number | null | undefined) =>
    v != null && v !== '' ? `<div class="vis-tt-row"><span class="vis-tt-k">${k}</span><span class="vis-tt-v">${v}</span></div>` : '';
  const head = (t: string, color?: string) =>
    `<div class="vis-tt-head" style="border-color:${color || '#555'}">${t}</div>`;
  const accent = getNodeThemeColor(getNodeTypeOrThrow(node.type), 'dark');
  let body = head(node.label, accent);
  body += row('ID', node.id);
  body += row('Page', page);

  flattenAttributes(node.attributes).forEach(item => {
    body += row(item.key, item.value);
  });

  return makeTitleEl(tt(body));
}

/* ============================================================================
 * NODE STYLING
 * ============================================================================ */

/**
 * Transform a raw topology node into a vis-network node object.
 *
 * Resolves the canonical node type, applies the dark-theme icon URL and
 * accent color, builds the display label and tooltip, and attaches the
 * original raw node as `_raw` for sidebar access on selection.
 *
 * @param {RawNode} node - Raw node from topology data
 * @param {PageId} page - Active page ID (passed through to label/tooltip builders)
 * @returns vis-network node object with shape, image, color, font, and _raw fields
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function styleNodeOrThrow(node: RawNode, page: PageId): any {
  const style = getNodeTypeOrThrow(node.type);
  const accentColor = getNodeThemeColor(style, 'dark');

  const styledNode: Record<string, unknown> = {
    id: node.id,
    label: buildLabel(node, page),
    title: buildTitleOrThrow(node, page),
    shape: 'image',
    image: style.iconURL.dark,
    shapeProperties: { useImageSize: false },
    color: toVisNodeColor(accentColor),
    font: buildNodeFont(accentColor),
    size: style.iconSizeScale,
    _raw: node,
  };

  return styledNode;
}

/* ============================================================================
 * EDGE STYLING
 * ============================================================================ */

/**
 * Transform a raw topology edge into a vis-network edge object.
 *
 * Resolves edge type color/dash pattern, builds a page-specific tooltip
 * (physical shows ports/speed/cable/VLANs; traffic shows TLS/protocol/domains;
 * vlan shows allowed/denied VLANs), and attaches the original raw edge as `_raw`
 * for sidebar access on selection.
 *
 * @param {RawEdge} edge - Raw edge from topology data
 * @param {PageId} page - Active page ID — controls which tooltip fields are shown
 * @returns vis-network edge object with color, dashes, tooltip, and _raw fields
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function styleEdgeOrThrow(edge: RawEdge, page: PageId): any {
  const edgeType = getEdgeTypeOrThrow(edge.type);
  const edgeColor = toVisEdgeColor(edgeType, 'dark');

  const tt = (rows: string) => `<div class="vis-tt">${rows}</div>`;
  const row = (k: string, v: string | null | undefined) =>
    v != null && v !== '' ? `<div class="vis-tt-row"><span class="vis-tt-k">${k}</span><span class="vis-tt-v">${v}</span></div>` : '';
  const head = (t: string) =>
    `<div class="vis-tt-head" style="border-color:${edgeColor.color}">${t}</div>`;

  let title: HTMLElement | null = null;
  const edgeLabel = getEdgeDisplayLabel(edge).replace(/\n/g, ' · ') || edge.type;

  if (page === 'physical') {
    title = makeTitleEl(
      tt(
        head(edgeLabel) +
          row('From', edge.from.port) +
          row('To', edge.to.port) +
          row('Speed', edge.speed) +
          row('Cable', edge.cable ? `${edge.cable} · ${edge.cableColor || ''}` : null) +
          row('VLANs', edge.vlans)
      )
    );
  } else if (page === 'traffic') {
    const tlsStr =
      edge.tls != null
        ? edge.tls
          ? `✓ TLS${edge.tlsTermination ? ' — ' + edge.tlsTermination : ''}`
          : '✗ No TLS'
        : null;
    const domains = edge.domains?.join(', ') || null;
    title = makeTitleEl(
      tt(
        head(edgeLabel) +
          row('TLS', tlsStr) +
          row('Port', edge.port) +
          row('Protocol', edge.protocol) +
          row('Domains', domains) +
          (edge.note ? `<div class="vis-tt-note">${edge.note}</div>` : '')
      )
    );
  } else if (page === 'vlan') {
    const m = edge.meta;
    const allowed = m?.allowed?.join(', ') || null;
    title = makeTitleEl(tt(head(edgeLabel) + row('Type', edge.type) + row('Allowed', allowed) + row('Denied', m?.denied)));
  }

  return {
    id: edge.id,
    from: edge.from.nodeId,
    to: edge.to.nodeId,
    label: getEdgeDisplayLabel(edge),
    title,
    font: { size: 13, color: '#475569', face: 'JetBrains Mono', strokeWidth: 0 },
    arrows: edge.arrows || '',
    color: edgeColor,
    width: 1,
    dashes: edgeType.dashes || false,
    smooth: { type: 'curvedCW', roundness: 0.15 },
    _raw: edge,
  };
}

/* ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================ */

/**
 * Wrap an HTML string in a detached DOM element for use as a vis-network tooltip.
 *
 * vis-network accepts either a string or an HTMLElement as a node/edge `title`.
 * Using an HTMLElement avoids double-escaping and allows the browser's own
 * HTML parser to handle the markup.
 *
 * @param {string} html - Inner HTML markup for the tooltip
 * @returns {HTMLElement} Detached `<div>` with the provided markup as `innerHTML`
 */
export function makeTitleEl(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

/* ============================================================================
 * MAIN TRANSFORMATION FUNCTION
 * ============================================================================ */

/**
 * Transform raw topology data into vis-network compatible node and edge objects.
 *
 * Filters out edges whose endpoints reference node IDs not present in `allNodes`
 * (dangling edges), then styles all valid nodes and edges for the given page.
 *
 * @param {RawNode[]} allNodes - All raw nodes from the topology data file
 * @param {RawEdge[]} allEdges - All raw edges from the topology data file
 * @param {PageId} pageId - Active page ID — controls label, tooltip, and color style
 * @returns Object containing styled vis-network nodes and edges, plus their raw originals
 */
export function buildPageDataOrThrow(allNodes: RawNode[], allEdges: RawEdge[], pageId: PageId) {
  const nodeIds = new Set(allNodes.map(n => n.id));

  const styledNodes = allNodes.map(n => styleNodeOrThrow(n, pageId));

  const validRawEdges = allEdges.filter(e => nodeIds.has(e.from.nodeId) && nodeIds.has(e.to.nodeId));
  const styledEdges = validRawEdges.map(e => styleEdgeOrThrow(e, pageId));

  return {
    nodes: styledNodes,
    edges: styledEdges,
    rawNodes: allNodes,
    rawEdges: validRawEdges,
  };
}
