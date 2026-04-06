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
 * - Settings: User preferences resolved from localStorage/default_settings.json
 * - App State: Runtime UI state like the settings panel visibility
 *
 * @see SettingsContext.tsx - Provider component and reducer implementation
 * @see useSettings.ts - Hook for consuming the context
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { createContext } from 'react';

import type { PageId } from '@/utils/page';
import type { ThemeId } from '@/utils/theme';
import type { FontSize } from '@/types/font';
import type { ScrollBehavior } from '@/types/scroll';

/**
 * User preferences resolved by SettingsContext.
 *
 * These settings control application behavior and appearance.
 *
 * @property {PageId} defaultPage - Page shown on app load
 * @property {string} appName - App title shown in the header
 * @property {ThemeId} theme - Color theme preference
 * @property {FontSize} fontSize - App-wide font size for UI scaling (pixels)
 * @property {ScrollBehavior} scrollBehavior - Scroll wheel behavior on canvas
 * @property {boolean} showNodeLabels - Show labels on nodes
 * @property {boolean} showLegend - Show the legend panel
 * @property {boolean} showEdgeLabels - Show labels on edges
 * @property {boolean} nodeAnimation - Enable animated node movement
 */
export interface AppSettings {
  defaultPage: PageId;
  appName: string;
  theme: ThemeId;
  fontSize: FontSize;
  scrollBehavior: ScrollBehavior;
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
 * - SET_FONT_SIZE: Change app-wide font size
 * - SET_SCROLL_BEHAVIOR: Change scroll wheel behavior
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
  | { type: 'SET_APP_NAME'; appName: string }
  | { type: 'SET_THEME'; theme: ThemeId }
  | { type: 'SET_DEFAULT_PAGE'; page: PageId }
  | { type: 'SET_FONT_SIZE'; size: FontSize }
  | { type: 'SET_SCROLL_BEHAVIOR'; scrollBehavior: ScrollBehavior }
  | { type: 'SET_NODE_LABEL_VISIBILITY'; isVisible: boolean }
  | { type: 'SET_LEGEND_VISIBILITY'; isVisible: boolean }
  | { type: 'SET_EDGE_LABEL_VISIBILITY'; isVisible: boolean }
  | { type: 'SET_NODE_ANIMATION'; isEnabled: boolean }
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
 * The useSettingsOrThrow() hook throws an error if used outside the provider.
 *
 * @example
 * // In a component (use the hook instead of direct context access)
 * const { state, dispatch } = useSettingsOrThrow();
 * dispatch({ type: 'SET_THEME', theme: 'light' });
 */
export const SettingsContext = createContext<{
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
} | null>(null);
