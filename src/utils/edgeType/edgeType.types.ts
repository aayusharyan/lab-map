/**
 * @file edgeType.types.ts
 * @description Type definitions for edge type registry
 *
 * This file defines the canonical EdgeType model shared by:
 * - Edge type registry constants (`EDGE_TYPES`)
 * - Graph transformation utilities (`page.ts`)
 * - Runtime theme update logic (`GraphView`, `useVisNetwork`)
 * - Sidebar legend/badge display helpers
 *
 * Type Categories:
 * 1. EdgeType - Canonical edge definition used across render + UI paths
 *
 * Design goals:
 * 1. Keep edge visual behavior centralized in one contract
 * 2. Keep UI labels and graph styling coupled to avoid drift
 * 3. Keep theme switching deterministic (`dark`/`light` pairs for all colors)
 *
 * Data Flow:
 * 1. EDGE_TYPES stores `Record<EdgeTypeId, EdgeType>`
 * 2. Raw edges resolve a type key (e.g., "trunk", "proxy", "intervlan")
 * 3. page.ts maps that type to vis-network color/hover/selection values
 * 4. Sidebar/Legend reuse the same type for labels and badges
 *
 * Contributor notes:
 * - Prefer additive changes to keep old topology payloads render-compatible.
 * - Keep `type` values stable once shipped; they act like data-facing IDs.
 * - If you add a new color property in runtime helpers, mirror it here and
 *   update all type entries in `edgeType.ts` in the same change.
 *
 * @see edgeType.ts - Registry constants and conversion helpers
 * @see page.ts - Edge transformation pipeline
 * @see GraphView.tsx - Runtime edge re-theming
 */

/* ============================================================================
 * EDGE TYPE MODEL
 * Canonical per-type configuration used across rendering and display
 * ============================================================================ */

/**
 * Canonical edge type definition.
 *
 * This model intentionally combines:
 * - visual rendering info (line color, hover color, selected color, dash style)
 * - UI-facing metadata (type, label)
 *
 * Keeping both in one model ensures a single source of truth for
 * graph rendering and sidebar/legend display.
 *
 * @property {string} type - Canonical edge type identifier matching EDGE_TYPES key (e.g., "trunk")
 * Kept as string in base metadata so derived edge ID unions can stay defined
 * from registry constants without circular type coupling.
 * @property {string} label - Human-readable name (e.g., "Trunk (Multi-VLAN)")
 * @property {{ dark: string; light: string }} color - Theme-specific base line color
 * @property {{ dark: string; light: string }} hover_color - Theme-specific hover color used by vis-network
 * @property {{ dark: string; light: string }} selected_color - Theme-specific selected/highlight color
 * @property {boolean | number[]} dashes - Dash pattern for vis-network
 * - `false` => solid line
 * - `[dashLen, gapLen]` => repeating dash/gap pattern
 *
 * Naming convention:
 * - `hover_color` / `selected_color` intentionally use snake_case because
 *   this shape is used as static registry data and has existing call-site usage.
 *   Keep keys stable unless the entire registry + access pattern is migrated.
 *
 * @example
 * // Solid edge style (physical link)
 * const trunk: EdgeType = {
 *   type: 'trunk',
 *   label: 'Trunk (Multi-VLAN)',
 *   color: { dark: '#60a5fa', light: '#3b82f6' },
 *   hover_color: { dark: '#93c5fd', light: '#2563eb' },
 *   selected_color: { dark: '#bfdbfe', light: '#1d4ed8' },
 *   dashes: false,
 * };
 *
 * @example
 * // Dashed edge style (logical/traffic flow)
 * const dependency: EdgeType = {
 *   type: 'dependency',
 *   label: 'Service Dependency',
 *   color: { dark: '#9b59b6', light: '#6a1b9a' },
 *   hover_color: { dark: '#c39bd3', light: '#8e24aa' },
 *   selected_color: { dark: '#c39bd3', light: '#8e24aa' },
 *   dashes: [4, 4],
 * };
 */
export interface EdgeType {
  type: string;
  label: string;
  color: {
    dark: string;
    light: string;
  };
  hover_color: {
    dark: string;
    light: string;
  };
  selected_color: {
    dark: string;
    light: string;
  };
  dashes: boolean | number[];
}
