/**
 * @file page.types.ts
 * @description Page type definitions for navigation and data transformation
 *
 * This file defines canonical page models shared by:
 * - Page registry constants (`PAGES`, `PAGE_IDS`)
 * - Router/state guards (`isPageId`, useRoute, SettingsContext)
 * - Graph transformation entrypoints (`buildPageDataOrThrow`)
 * - Data loading utilities (`loadPageDataOrThrow`)
 *
 * Type Categories:
 * 1. Page - Canonical metadata for page tabs and labels
 * 2. PageId - Canonical page key used in routing/settings state
 * 3. Flow - Named traffic flow for the traffic page
 * 4. PageData - Complete page payload as loaded from JSON
 *
 * Data Flow:
 * 1. UI/router selects a `PageId`
 * 2. Registry resolves labels/titles from `PAGES`
 * 3. Graph pipeline transforms raw topology for that page context
 * 4. `PageData` carries `RawNode[]` + `RawEdge[]` + optional `Flow[]`
 *
 * @see page.ts - Page registry and data transformation helpers
 * @see routing.ts - URL parsing and route normalization
 * @see SettingsContext.types.ts - Settings model using PageId
 * @see src/utils/data.ts - loadPageDataOrThrow returns PageData
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import type { RawEdge } from '@/utils/edge';
import type { RawNode } from '@/utils/node';

/* ============================================================================
 * PAGE MODELS
 * Shared between tab navigation, routing, and transform helpers
 * ============================================================================ */

/**
 * Canonical page metadata used by tabs, selectors, and tooltips.
 *
 * @property {PageId} id - Canonical page key
 * @property {string} label - Short tab label
 * @property {string} title - Descriptive page summary
 */
export interface Page {
  id: PageId;
  label: string;
  title: string;
}

/**
 * Canonical page key used across routing and settings state.
 */
export type PageId = 'physical' | 'traffic' | 'vlan';

/* ============================================================================
 * PAGE DATA MODELS
 * Raw data structures loaded from JSON files
 * ============================================================================ */

/**
 * Traffic flow definition.
 *
 * Defines a named traffic flow for the traffic page.
 * Flows are declared in traffic.json and referenced by nodes/edges.
 *
 * @property {string} id - Unique flow identifier
 * @property {string} label - Display label for the flow
 */
export interface Flow {
  id: string;
  label: string;
}

/**
 * Complete page data as loaded from JSON.
 *
 * This structure matches the top-level structure of page JSON files
 * (physical.json, traffic.json, vlan.json).
 *
 * @property {RawNode[]} nodes - Array of nodes in this page
 * @property {RawEdge[]} edges - Array of edges in this page
 * @property {Flow[]} [flows] - Traffic flows (traffic page only)
 */
export interface PageData {
  nodes: RawNode[];
  edges: RawEdge[];
  flows?: Flow[];
}
