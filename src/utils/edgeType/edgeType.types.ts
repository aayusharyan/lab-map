/**
 * @file edgeType.types.ts
 * @description Edge type definitions for styling and display
 *
 * This file contains type definitions for edge visual styling
 * and display information used across the application.
 *
 * @see edgeType.ts - Edge constants and helpers (EDGE_TYPES, toVisEdgeColor)
 * @see topology.ts - Core topology data types (RawEdge, EdgeMeta)
 */

/* ============================================================================
 * DISPLAY INFO TYPES
 * ============================================================================ */

/**
 * Edge type definition.
 *
 * Complete information about an edge type for display purposes.
 * Combines visual styling with human-readable label.
 * Used by Legend, tooltips, and other display components.
 *
 * @property {string} type - Edge type identifier (e.g., "trunk")
 * @property {string} label - Human-readable name (e.g., "Trunk (multi-VLAN)")
 * @property {{ dark: string; light: string }} color - Theme-specific edge line color
 * @property {{ dark: string; light: string }} hover_color - Theme-specific edge hover color
 * @property {{ dark: string; light: string }} selected_color - Theme-specific edge selected color
 * @property {boolean | number[]} dashes - Dash pattern
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
