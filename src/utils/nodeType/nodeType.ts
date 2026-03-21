/**
 * @file nodeType.ts
 * @description Canonical node type registry and node-style helpers
 *
 * This module defines the single source of truth for node visual types used
 * across graph rendering, legends, sidebars, and rack layout icon loading.
 *
 * Exports:
 * - DEFAULT_NODE_TYPE_KEY: Stable fallback key for unknown/invalid type values
 * - NODE_TYPES: Canonical node registry keyed by real icon folder names
 * - resolveNodeType: Resolve a raw key to a NodeType config (no aliasing)
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
 * @see useVisNetwork.ts - Shared vis-network setup and theme sync
 * @see LayoutView.tsx - Rack layout icon loading
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import type { NodeType } from './nodeType.types';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/** Default canonical node type key used as the hard fallback. */
export const DEFAULT_NODE_TYPE_KEY = 'server-rack-1u-compute-1';

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
export const NODE_TYPES: Record<string, NodeType> = {
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
};

/* ============================================================================
 * RESOLUTION HELPERS
 * ============================================================================ */

/**
 * Resolve a raw node type key to its canonical NodeType config.
 *
 * @param {string | undefined} type - Raw node type key
 * @returns {NodeType | undefined} NodeType config if present
 */
export function resolveNodeType(type: string | undefined): NodeType | undefined {
  if (!type) return undefined;
  return NODE_TYPES[type];
}

/* ============================================================================
 * RENDERING HELPERS
 * ============================================================================ */

/**
 * Resolve a node theme color for the active theme.
 *
 * @param {NodeType | undefined} nodeType - Resolved node type config
 * @param {'dark' | 'light'} theme - Active resolved theme
 * @param {string} [fallback='#888'] - Fallback color when missing
 * @returns {string} Theme-specific accent color
 */
export function getNodeThemeColor(
  nodeType: NodeType | undefined,
  theme: 'dark' | 'light',
  fallback = '#888'
) {
  return nodeType?.color?.[theme] ?? fallback;
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
