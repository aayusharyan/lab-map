/**
 * @file SettingsContext.types.ts
 * @description SettingsContext type definitions and context instance creation
 *
 * This file defines the TypeScript interfaces and creates the React Context
 * instance for application settings management. It is separated from
 * SettingsContext.tsx to satisfy the react-refresh/only-export-components
 * ESLint rule, which requires that files exporting React components should
 * not also export non-component values.
 *
 * Architecture:
 * - SettingsState: Internal state shape (settings + UI state)
 * - SettingsAction: Union type of all possible dispatch actions
 * - SettingsContext: React Context instance for settings distribution
 *
 * Settings vs App State:
 * - Settings: User preferences resolved from localStorage/settings.json
 * - App State: Runtime UI state like the settings panel visibility
 *
 * @see SettingsContext.tsx - Provider component and reducer implementation
 * @see useSettings.ts - Hook for consuming the context
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { createContext } from 'react';

import type { PageId, ThemeId } from '@/types/topology';

export const NODE_FONT_SIZES = [11, 13, 15, 17, 19] as const;

export type NodeFontSize = (typeof NODE_FONT_SIZES)[number];

/**
 * User preferences resolved by SettingsContext.
 *
 * These settings control application behavior and appearance.
 *
 * @property {PageId} defaultPage - Page shown on app load
 * @property {ThemeId} theme - Color theme preference
 * @property {NodeFontSize} nodeFontSize - Font size for node labels (pixels)
 * @property {boolean} scrollToZoom - Enable scroll-to-zoom on canvas
 * @property {boolean} showNodeLabels - Show labels on nodes
 * @property {boolean} showLegend - Show the legend panel
 * @property {boolean} showEdgeLabels - Show labels on edges
 * @property {boolean} nodeAnimation - Enable animated node movement
 */
export interface AppSettings {
  defaultPage: PageId;
  theme: ThemeId;
  nodeFontSize: NodeFontSize;
  scrollToZoom: boolean;
  showNodeLabels: boolean;
  showLegend: boolean;
  showEdgeLabels: boolean;
  nodeAnimation: boolean;
}

/* ============================================================================
 * STATE INTERFACE
 * ============================================================================ */

/**
 * Internal state shape for settings context.
 *
 * Combines the resolved settings with UI state
 * for the settings panel.
 *
 * @property {AppSettings} settings - Resolved application settings
 * @property {boolean} isPanelOpen - Whether the settings panel is visible
 */
export interface SettingsState {
  settings: AppSettings;
  isPanelOpen: boolean;
}

/* ============================================================================
 * ACTION TYPES
 * ============================================================================ */

/**
 * Union type of all possible actions for the settings reducer.
 *
 * Each action type corresponds to a case in the reducer function.
 * Actions follow the Flux Standard Action pattern.
 *
 * Initialization:
 * - LOAD_SETTINGS: Load the resolved settings snapshot after bootstrap
 *
 * Setting Updates:
 * - SET_THEME: Change color theme preference
 * - SET_DEFAULT_PAGE: Change default page shown on app load
 * - SET_NODE_FONT_SIZE: Change node label font size
 * - SET_SCROLL_TO_ZOOM: Toggle scroll-to-zoom behavior
 * - SET_NODE_LABEL_VISIBILITY: Toggle node label visibility
 * - SET_LEGEND_VISIBILITY: Toggle legend visibility
 * - SET_EDGE_LABEL_VISIBILITY: Toggle edge label visibility
 * - SET_NODE_ANIMATION: Toggle animated node movement in the graph
 *
 * Panel State:
 * - OPEN_PANEL: Open settings panel
 * - CLOSE_PANEL: Close settings panel
 */
export type SettingsAction =
  | { type: 'LOAD_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'SET_THEME'; theme: ThemeId }
  | { type: 'SET_DEFAULT_PAGE'; page: PageId }
  | { type: 'SET_NODE_FONT_SIZE'; size: NodeFontSize }
  | { type: 'SET_SCROLL_TO_ZOOM'; enabled: boolean }
  | { type: 'SET_NODE_LABEL_VISIBILITY'; visible: boolean }
  | { type: 'SET_LEGEND_VISIBILITY'; visible: boolean }
  | { type: 'SET_EDGE_LABEL_VISIBILITY'; visible: boolean }
  | { type: 'SET_NODE_ANIMATION'; enabled: boolean }
  | { type: 'OPEN_PANEL' }
  | { type: 'CLOSE_PANEL' };

/* ============================================================================
 * CONTEXT INSTANCE
 * ============================================================================ */

/**
 * React Context instance for application settings.
 *
 * The context value contains:
 * - state: Current SettingsState (read-only)
 * - dispatch: Function to dispatch SettingsAction to modify state
 *
 * Default value is null to enforce usage within SettingsProvider.
 * The useSettings() hook throws an error if used outside the provider.
 *
 * @example
 * // In a component (use the hook instead of direct context access)
 * const { state, dispatch } = useSettings();
 * dispatch({ type: 'SET_THEME', theme: 'light' });
 */
export const SettingsContext = createContext<{
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
} | null>(null);
