/**
 * @file nodeType.ts
 * @description Canonical node type registry and node-style helpers
 *
 * This module defines the single source of truth for node visual types used
 * across graph rendering, legends, and sidebars.
 *
 * Exports:
 * - NODE_TYPES: Canonical node registry keyed by real icon folder names
 * - NODE_TYPE_IDS: Canonical list of all registry keys
 * - NodeTypeId: Union of canonical node type keys
 * - isNodeType: Type guard for validating unknown string values
 * - getNodeTypeOrThrow: Resolve a raw key and throw on unknown type
 * - getNodeThemeColor: Select theme-specific accent color for a NodeType
 * - toVisNodeColor: Convert accent color to vis-network color object
 * - buildNodeFont: Build shared vis-network font object for node labels
 *
 * Registry Contract:
 * - Every key in NODE_TYPES must correspond to an actual folder under
 *   `public/node-icons/<type>/`.
 * - Data and schema must use these exact canonical keys.
 * - `iconURL` stores explicit dark/light icon paths.
 *
 * @see nodeType.types.ts - Canonical NodeType model
 * @see page.ts - Node transformation for vis-network
 * @see GraphView.tsx - Runtime theme updates on graph nodes
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import type { NodeType } from './nodeType.types';
import { getSystemTheme, type ThemeId } from '@/utils/theme';

/**
 * Using string as a key here because this is base, the NodeTypeId is derived later.
 * We cannot use NodeTypeId as key here otherwise it will become circular dependency.
 */
const defineNodeTypes = <T extends Record<string, NodeType>>(types: T) => types;

/* ============================================================================
 * NODE TYPE REGISTRY
 * Canonical node type definitions keyed by real icon folder names
 * ============================================================================ */

/**
 * Canonical node type registry.
 *
 * Registry rules:
 * - Keys must be concrete icon folder names in `public/node-icons`.
 * - Values include iconURL paths, theme colors, display label, and visual scale.
 */
const NODE_TYPES_MAP = defineNodeTypes({
  /* ==========================================================================
   * GENERIC ICONS
   * ========================================================================== */

  'generic-internet-1': {
    type: 'generic-internet-1',
    label: 'Internet (WAN) - Variant 1',
    iconURL: { dark: '/node-icons/generic-internet-1/dark.svg', light: '/node-icons/generic-internet-1/light.svg' },
    color: { dark: '#38bdf8', light: '#0277bd' },
    iconSizeScale: 36,
  },
  'generic-internet-2': {
    type: 'generic-internet-2',
    label: 'Internet (WAN) - Variant 2',
    iconURL: { dark: '/node-icons/generic-internet-2/dark.svg', light: '/node-icons/generic-internet-2/light.svg' },
    color: { dark: '#38bdf8', light: '#0277bd' },
    iconSizeScale: 36,
  },
  'generic-internet-3': {
    type: 'generic-internet-3',
    label: 'Internet (WAN) - Variant 3',
    iconURL: { dark: '/node-icons/generic-internet-3/dark.svg', light: '/node-icons/generic-internet-3/light.svg' },
    color: { dark: '#38bdf8', light: '#0277bd' },
    iconSizeScale: 36,
  },
  'generic-internet-4': {
    type: 'generic-internet-4',
    label: 'Internet (WAN) - Variant 4',
    iconURL: { dark: '/node-icons/generic-internet-4/dark.svg', light: '/node-icons/generic-internet-4/light.svg' },
    color: { dark: '#38bdf8', light: '#0277bd' },
    iconSizeScale: 36,
  },
  'generic-vpn-1': {
    type: 'generic-vpn-1',
    label: 'VPN Tunnel - Variant 1',
    iconURL: { dark: '/node-icons/generic-vpn-1/dark.svg', light: '/node-icons/generic-vpn-1/light.svg' },
    color: { dark: '#a78bfa', light: '#7b1fa2' },
    iconSizeScale: 36,
  },

  /* ==========================================================================
   * DESKTOP DEVICES
   * ========================================================================== */

  'desktop-compute-1': {
    type: 'desktop-compute-1',
    label: 'Desktop Workstation - Variant 1',
    iconURL: { dark: '/node-icons/desktop-compute-1/dark.svg', light: '/node-icons/desktop-compute-1/light.svg' },
    color: { dark: '#38bdf8', light: '#0277bd' },
    iconSizeScale: 13,
  },
  'desktop-compute-2': {
    type: 'desktop-compute-2',
    label: 'Desktop Workstation - Variant 2',
    iconURL: { dark: '/node-icons/desktop-compute-2/dark.svg', light: '/node-icons/desktop-compute-2/light.svg' },
    color: { dark: '#38bdf8', light: '#0277bd' },
    iconSizeScale: 13,
  },
  'desktop-router-1': {
    type: 'desktop-router-1',
    label: 'Desktop Router/Firewall - Variant 1',
    iconURL: { dark: '/node-icons/desktop-router-1/dark.svg', light: '/node-icons/desktop-router-1/light.svg' },
    color: { dark: '#e74c3c', light: '#c62828' },
    iconSizeScale: 36,
  },

  /* ==========================================================================
   * 1U RACK DEVICES
   * ========================================================================== */

  'server-rack-1u-compute-1': {
    type: 'server-rack-1u-compute-1',
    label: '1U Rack Server - Variant 1',
    iconURL: { dark: '/node-icons/server-rack-1u-compute-1/dark.svg', light: '/node-icons/server-rack-1u-compute-1/light.svg' },
    color: { dark: '#38bdf8', light: '#0277bd' },
    iconSizeScale: 3,
  },
  'server-rack-1u-compute-2': {
    type: 'server-rack-1u-compute-2',
    label: '1U Rack Server - Variant 2',
    iconURL: { dark: '/node-icons/server-rack-1u-compute-2/dark.svg', light: '/node-icons/server-rack-1u-compute-2/light.svg' },
    color: { dark: '#38bdf8', light: '#0277bd' },
    iconSizeScale: 3,
  },
  'server-rack-1u-nas-hdd-1': {
    type: 'server-rack-1u-nas-hdd-1',
    label: '1U NAS (HDD) - Variant 1',
    iconURL: { dark: '/node-icons/server-rack-1u-nas-hdd-1/dark.svg', light: '/node-icons/server-rack-1u-nas-hdd-1/light.svg' },
    color: { dark: '#4ade80', light: '#2e7d32' },
    iconSizeScale: 3,
  },
  'server-rack-1u-router-1': {
    type: 'server-rack-1u-router-1',
    label: '1U Router/Firewall - Variant 1',
    iconURL: { dark: '/node-icons/server-rack-1u-router-1/dark.svg', light: '/node-icons/server-rack-1u-router-1/light.svg' },
    color: { dark: '#e74c3c', light: '#c62828' },
    iconSizeScale: 3,
  },
  'server-rack-1u-switch-1': {
    type: 'server-rack-1u-switch-1',
    label: '1U Managed Switch - Variant 1',
    iconURL: { dark: '/node-icons/server-rack-1u-switch-1/dark.svg', light: '/node-icons/server-rack-1u-switch-1/light.svg' },
    color: { dark: '#26c6da', light: '#00838f' },
    iconSizeScale: 3,
  },
  'server-rack-1u-switch-2': {
    type: 'server-rack-1u-switch-2',
    label: '1U Managed Switch - Variant 2',
    iconURL: { dark: '/node-icons/server-rack-1u-switch-2/dark.svg', light: '/node-icons/server-rack-1u-switch-2/light.svg' },
    color: { dark: '#26c6da', light: '#00838f' },
    iconSizeScale: 3,
  },

  /* ==========================================================================
   * 2U RACK DEVICES
   * ========================================================================== */

  'server-rack-2u-compute-1': {
    type: 'server-rack-2u-compute-1',
    label: '2U Rack Server - Variant 1',
    iconURL: { dark: '/node-icons/server-rack-2u-compute-1/dark.svg', light: '/node-icons/server-rack-2u-compute-1/light.svg' },
    color: { dark: '#38bdf8', light: '#0277bd' },
    iconSizeScale: 7,
  },
  'server-rack-2u-nas-hdd-1': {
    type: 'server-rack-2u-nas-hdd-1',
    label: '2U NAS (HDD) - Variant 1',
    iconURL: { dark: '/node-icons/server-rack-2u-nas-hdd-1/dark.svg', light: '/node-icons/server-rack-2u-nas-hdd-1/light.svg' },
    color: { dark: '#4ade80', light: '#2e7d32' },
    iconSizeScale: 7,
  },
  'server-rack-2u-nas-ssd-1': {
    type: 'server-rack-2u-nas-ssd-1',
    label: '2U NAS (SSD) - Variant 1',
    iconURL: { dark: '/node-icons/server-rack-2u-nas-ssd-1/dark.svg', light: '/node-icons/server-rack-2u-nas-ssd-1/light.svg' },
    color: { dark: '#4ade80', light: '#2e7d32' },
    iconSizeScale: 7,
  },
});

/** Canonical node type keys derived from NODE_TYPES. */
export type NodeTypeId = keyof typeof NODE_TYPES_MAP;
export const NODE_TYPES: Record<NodeTypeId, NodeType> = NODE_TYPES_MAP;
/**
 * Type guard for validating canonical node type IDs.
 *
 * @param {string} value - Raw node type value to validate
 * @returns {boolean} True when the value maps to a canonical node type
 */
export function isNodeType(value: string): value is NodeTypeId {
  return Object.prototype.hasOwnProperty.call(NODE_TYPES_MAP, value);
}

/* ============================================================================
 * RESOLUTION HELPERS
 * ============================================================================ */

/**
 * Resolve a raw node type key and throw when the type is unknown.
 *
 * @param {string | undefined} type - Raw node type key
 * @returns {NodeType} NodeType config
 */
export function getNodeTypeOrThrow(type: string | undefined): NodeType {
  const resolved = type && isNodeType(type) ? NODE_TYPES[type] : undefined;
  if (!resolved) {
    throw new Error(`Unknown node type: "${type ?? '(missing)'}"`);
  }
  return resolved;
}

/* ============================================================================
 * RENDERING HELPERS
 * ============================================================================ */

/**
 * Resolve a node theme color for the active theme.
 *
 * @param {NodeType} nodeType - Resolved node type config
 * @param {ThemeId} [theme='system'] - Active theme preference (dark, light, or system)
 * @returns {string} Theme-specific accent color
 */
export function getNodeThemeColor(
  nodeType: NodeType,
  theme: ThemeId = 'system'
): string {
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
  return resolvedTheme === 'dark' ? nodeType.color.dark : nodeType.color.light;
}

/**
 * Convert a color string to vis-network node color structure.
 *
 * @param {string} color - Accent color
 * @returns {{ border: string; background: string }} vis-network color object
 */
export function toVisNodeColor(color: string) {
  return {
    border: color,
    background: 'rgba(0,0,0,0)',
  };
}

/**
 * Build shared vis-network font settings for node labels.
 *
 * @param {string} color - Label color
 * @returns {{ face: string; size: number; color: string }} vis-network font object
 */
export function buildNodeFont(color: string) {
  return { face: 'JetBrains Mono', size: 15, color };
}
