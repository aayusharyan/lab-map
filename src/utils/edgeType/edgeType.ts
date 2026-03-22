/**
 * @file edgeType.ts
 * @description Canonical edge type registry and edge-style helpers
 *
 * This file contains all visual styling configuration for network edges
 * across both dark and light themes.
 *
 * Exports:
 * - EDGE_TYPES: Canonical edge registry keyed by edge type
 * - EDGE_TYPE_IDS: Canonical list of all registry keys
 * - EdgeTypeId: Union of canonical edge type keys
 * - isEdgeType: Type guard for validating unknown string values
 * - getEdgeTypeOrThrow: Resolve a raw key and throw on unknown type
 * - getEdgeThemeColor: Select theme-specific line color for an EdgeType
 * - toVisEdgeColor: Convert edge color to vis-network color object
 *
 * Edge Categories:
 * - Physical (solid): wan, trunk, access
 * - Traffic (dashed): cdn, proxy, hosts, forward, dependency, internal
 * - VLAN: member, intervlan, gateway-link
 *
 * @see nodeType.ts - Node styling configuration
 * @see page.ts - Uses these styles to transform data
 * @see GraphView.tsx - Applies these styles to vis-network
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import type { EdgeType } from './edgeType.types';
import { getSystemTheme, type ThemeId } from '@/utils/theme';

const defineEdgeTypes = <T extends Record<string, EdgeType>>(types: T) => types;

/* ============================================================================
 * EDGE TYPES
 * Canonical edge type definitions
 * ============================================================================ */

/**
 * Canonical edge type registry.
 *
 * Each entry defines edge display metadata and theme-aware visuals:
 * - type: Canonical edge type ID
 * - label: Human-readable edge label
 * - color: Dark/light theme line colors
 * - hover_color: Dark/light theme hover colors
 * - selected_color: Dark/light theme selected colors
 * - dashes: Dash pattern (false for solid, [dashLen, gapLen] for dashed)
 *
 * Edge categories:
 * - Physical (solid): wan, trunk, access
 * - Traffic (dashed): cdn, proxy, hosts, forward, dependency, internal
 * - VLAN: member, intervlan, gateway-link
 */
const EDGE_TYPES_MAP = defineEdgeTypes({
  /** Trunk link (multi-VLAN) */
  trunk:      { type: 'trunk', label: 'Trunk (multi-VLAN)', color: { dark: '#e67e22', light: '#d35400' }, hover_color: { dark: '#f5a623', light: '#e67e22' }, selected_color: { dark: '#f5a623', light: '#e67e22' }, dashes: false },

  /** WAN uplink */
  wan:        { type: 'wan', label: 'WAN Uplink', color: { dark: '#38bdf8', light: '#0277bd' }, hover_color: { dark: '#7dd3fc', light: '#0288d1' }, selected_color: { dark: '#7dd3fc', light: '#0288d1' }, dashes: false },

  /** Access port (single VLAN) */
  access:     { type: 'access', label: 'Access Port (single VLAN)', color: { dark: '#7f8c8d', light: '#546e7a' }, hover_color: { dark: '#aab7b8', light: '#78909c' }, selected_color: { dark: '#aab7b8', light: '#78909c' }, dashes: false },

  /** Traefik proxy route */
  proxy:      { type: 'proxy', label: 'Reverse Proxy Route', color: { dark: '#3498db', light: '#1565c0' }, hover_color: { dark: '#5dade2', light: '#1976d2' }, selected_color: { dark: '#5dade2', light: '#1976d2' }, dashes: [6, 3] },

  /** Cloudflare CDN proxy */
  cdn:        { type: 'cdn', label: 'Cloudflare Proxy', color: { dark: '#f6821f', light: '#e65100' }, hover_color: { dark: '#ffaa55', light: '#f57c00' }, selected_color: { dark: '#ffaa55', light: '#f57c00' }, dashes: [6, 3] },

  /** Service hosted on node */
  hosts:      { type: 'hosts', label: 'Service Hosted', color: { dark: '#95a5a6', light: '#78909c' }, hover_color: { dark: '#bfc9ca', light: '#90a4ae' }, selected_color: { dark: '#bfc9ca', light: '#90a4ae' }, dashes: [3, 3] },

  /** DNS upstream forward */
  forward:    { type: 'forward', label: 'DNS Forward', color: { dark: '#e74c3c', light: '#c62828' }, hover_color: { dark: '#f1948a', light: '#e53935' }, selected_color: { dark: '#f1948a', light: '#e53935' }, dashes: [4, 4] },

  /** Service dependency */
  dependency: { type: 'dependency', label: 'Service Dependency', color: { dark: '#9b59b6', light: '#6a1b9a' }, hover_color: { dark: '#c39bd3', light: '#8e24aa' }, selected_color: { dark: '#c39bd3', light: '#8e24aa' }, dashes: [4, 4] },

  /** Internal container API */
  internal:   { type: 'internal', label: 'Internal API', color: { dark: '#27ae60', light: '#2e7d32' }, hover_color: { dark: '#58d68d', light: '#388e3c' }, selected_color: { dark: '#58d68d', light: '#388e3c' }, dashes: [3, 3] },

  /** VLAN membership */
  member:     { type: 'member', label: 'VLAN Membership', color: { dark: '#5d6d7e', light: '#546e7a' }, hover_color: { dark: '#85929e', light: '#78909c' }, selected_color: { dark: '#85929e', light: '#78909c' }, dashes: [2, 4] },

  /** Gateway link */
  'gateway-link': { type: 'gateway-link', label: 'Gateway Link', color: { dark: '#a78bfa', light: '#7b1fa2' }, hover_color: { dark: '#c4b5fd', light: '#9c27b0' }, selected_color: { dark: '#c4b5fd', light: '#9c27b0' }, dashes: false },

  /** Inter-VLAN firewall rule */
  intervlan:  { type: 'intervlan', label: 'Inter-VLAN Rule', color: { dark: '#e74c3c', light: '#c62828' }, hover_color: { dark: '#f1948a', light: '#e53935' }, selected_color: { dark: '#f1948a', light: '#e53935' }, dashes: false },
});

/** Canonical edge type keys derived from EDGE_TYPES. */
export type EdgeTypeId = keyof typeof EDGE_TYPES_MAP;
export const EDGE_TYPES: Record<EdgeTypeId, EdgeType> = EDGE_TYPES_MAP;
export const EDGE_TYPE_IDS = Object.keys(EDGE_TYPES_MAP) as EdgeTypeId[];

/**
 * Type guard for validating canonical edge type IDs.
 *
 * @param {string} value - Raw edge type value to validate
 * @returns {boolean} True when the value maps to a canonical edge type
 */
export function isEdgeType(value: string): value is EdgeTypeId {
  return Object.prototype.hasOwnProperty.call(EDGE_TYPES_MAP, value);
}

/**
 * Resolve a raw edge type key and throw when the type is unknown.
 *
 * @param {string | undefined} type - Raw edge type key
 * @returns {EdgeType} Canonical edge type config
 */
export function getEdgeTypeOrThrow(type: string | undefined): EdgeType {
  const resolved = type && isEdgeType(type) ? EDGE_TYPES[type] : undefined;
  if (!resolved) {
    throw new Error(`Unknown edge type: "${type ?? '(missing)'}"`);
  }
  return resolved;
}

/**
 * Resolve an edge line color for a given theme preference.
 *
 * @param {EdgeType} edgeType - Canonical edge type config
 * @param {ThemeId} [theme='system'] - Theme preference
 * @returns {string} Theme-resolved edge line color
 */
export function getEdgeThemeColor(edgeType: EdgeType, theme: ThemeId = 'system'): string {
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
  return resolvedTheme === 'dark' ? edgeType.color.dark : edgeType.color.light;
}

/**
 * Convert an edge type to a vis-network edge color object.
 *
 * @param {EdgeType} edgeType - Canonical edge type config
 * @param {ThemeId} [theme='system'] - Theme preference
 * @returns {{ color: string; hover: string; highlight: string }} vis-network color set for line/hover/highlight
 */
export function toVisEdgeColor(edgeType: EdgeType, theme: ThemeId = 'system'): { color: string; hover: string; highlight: string } {
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
  return {
    color: resolvedTheme === 'dark' ? edgeType.color.dark : edgeType.color.light,
    hover: resolvedTheme === 'dark' ? edgeType.hover_color.dark : edgeType.hover_color.light,
    highlight: resolvedTheme === 'dark' ? edgeType.selected_color.dark : edgeType.selected_color.light,
  };
}
