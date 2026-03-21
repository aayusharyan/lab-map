/**
 * @file nodeType.types.ts
 * @description Type definitions for node type registry
 *
 * This file defines the canonical NodeType model shared by:
 * - Node type registry constants (`NODE_TYPES`)
 * - Graph transformation utilities (`page.ts`)
 * - Theme update logic (`GraphView`, `useVisNetwork`)
 * - Sidebar legend/badge display helpers
 *
 * Type Categories:
 * 1. NodeType - Canonical node definition used across render + UI paths
 *
 * Data Flow:
 * 1. NODE_TYPES stores `Record<string, NodeType>`
 * 2. Raw nodes resolve a type key (e.g., "server-rack-1u-compute")
 * 3. page.ts maps that type to vis-network image/color/scale/font values
 * 4. Sidebar/Legend reuse the same type for labels/icons
 *
 * @see nodeType.ts - Registry constants and conversion helpers
 * @see page.ts - Node transformation pipeline
 * @see GraphView.tsx - Runtime theme application
 */

/* ============================================================================
 * NODE TYPE MODEL
 * Canonical per-type configuration used across rendering and display
 * ============================================================================ */

/**
 * Canonical node type definition.
 *
 * This model intentionally combines:
 * - visual rendering info (iconURL, color, iconSizeScale)
 * - UI-facing metadata (type, label)
 *
 * Keeping both in one model ensures a single source of truth for
 * graph rendering and sidebar/legend display.
 *
 * @property {string} type - Node type identifier (e.g., "desktop-router")
 * @property {string} label - Human-readable name (e.g., "Desktop Router")
 * @property {string} iconURL - URL path to the node icon asset
 * @property {{ dark: string; light: string }} color - Theme-specific accent colors
 * @property {number} iconSizeScale - Per-type icon size scale for vis-network
 */
export interface NodeType {
  type: string;
  label: string;
  iconURL: string;
  color: {
    dark: string;
    light: string;
  };
  iconSizeScale: number;
}
