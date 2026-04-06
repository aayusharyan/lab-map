/**
 * @file useSettings.ts
 * @description Hooks for accessing application settings state
 *
 * This file provides three hooks for accessing settings managed by
 * SettingsContext. They are separated from SettingsContext.tsx to
 * satisfy the react-refresh/only-export-components ESLint rule.
 *
 * Hook Type: Context-based
 * These are context consumer hooks that wrap React's useContext. They require
 * the component tree to be wrapped in SettingsProvider.
 *
 * Error Handling:
 * useSettingsOrThrow() throws an error if used outside of SettingsProvider:
 * - React's useContext returns undefined when used outside a provider
 * - Without validation, you'd get cryptic "cannot read property of undefined"
 * - Throwing early catches setup mistakes during development
 *
 * useSettingsValue() and useSettingsPanel() inherit this behavior since they
 * call useSettingsOrThrow() internally.
 *
 * Note: Browser API hooks (useActivePage, useSelection) don't throw because
 * they read from window.location which always exists in a browser environment.
 * Only context-based hooks need provider validation.
 *
 * Available Hooks:
 * 1. useSettingsOrThrow() - Full context access (state + dispatch)
 * 2. useSettingsValue() - Shorthand for just the settings values
 * 3. useSettingsPanel() - Panel open/close state and controls
 *
 * @example
 * // Full context access
 * const { state, dispatch } = useSettingsOrThrow();
 * dispatch({ type: 'SET_THEME', theme: 'light' });
 *
 * // Just settings values
 * const settings = useSettingsValue();
 * console.log(settings.theme, settings.fontSize);
 *
 * // Panel controls
 * const { isOpen, open, close } = useSettingsPanel();
 * <button onClick={open}>Settings</button>
 *
 * @see SettingsContext/SettingsContext.tsx - Provider component and reducer implementation
 * @see SettingsContext/SettingsContext.types.ts - Type definitions
 * @see useAppContext.ts - Similar pattern for app-level state
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useContext } from 'react';

import { SettingsContext } from '@/context/SettingsContext';

/* ============================================================================
 * HOOKS
 * ============================================================================ */

/**
 * Hook to access full settings state and dispatch function.
 *
 * Provides complete access to the settings context, including:
 * - state.settings: The actual settings values (AppSettings)
 * - state.isPanelOpen: Whether the settings panel is visible
 * - dispatch: Function to dispatch actions to modify settings
 *
 * @returns {object} Object containing state and dispatch
 * @returns {SettingsState} state - Current settings state
 * @returns {Dispatch<SettingsAction>} dispatch - Function to dispatch actions
 * @throws {Error} If used outside of SettingsProvider
 *
 * @example
 * const { state, dispatch } = useSettingsOrThrow();
 *
 * // Access settings
 * const theme = state.settings.theme;
 *
 * // Update a setting
 * dispatch({ type: 'SET_THEME', theme: 'dark' });
 */
export function useSettingsOrThrow() {
  const ctx = useContext(SettingsContext);

  /**
   * Throw descriptive error if hook is used outside provider.
   */
  if (!ctx) {
    throw new Error('useSettingsOrThrow must be used within SettingsProvider');
  }

  return ctx;
}

/**
 * Hook to access just the settings values (shorthand).
 *
 * Convenience hook when you only need to read settings values
 * and don't need to modify them or check loading state.
 *
 * @returns {AppSettings} The current settings values
 * @throws {Error} If used outside of SettingsProvider
 *
 * @example
 * const settings = useSettingsValue();
 *
 * // Access individual settings
 * const { theme, fontSize, showNodeLabels, showLegend } = settings;
 *
 * // Use in conditional rendering
 * return (
 *   <div className={settings.theme}>
 *     {settings.showLegend && <Legend />}
 *   </div>
 * );
 */
export function useSettingsValue() {
  const { state } = useSettingsOrThrow();
  return state.settings;
}

/**
 * Hook for settings panel open/close state and controls.
 *
 * Provides a focused API for managing the settings panel visibility,
 * useful for components that only need to open/close the panel.
 *
 * @returns {object} Panel state and control functions
 * @returns {boolean} isOpen - Whether the panel is currently open
 * @returns {function} open - Function to open the panel
 * @returns {function} close - Function to close the panel
 * @throws {Error} If used outside of SettingsProvider
 *
 * @example
 * const { isOpen, open, close } = useSettingsPanel();
 *
 * // Toggle button in header
 * <button onClick={open} aria-pressed={isOpen}>
 *   Settings
 * </button>
 *
 * // Close button in panel
 * <button onClick={close}>Close</button>
 *
 * // Conditional panel rendering
 * {isOpen && <SettingsPanelContent />}
 */
export function useSettingsPanel() {
  const { state, dispatch } = useSettingsOrThrow();

  return {
    /** Whether the settings panel is currently open */
    isOpen: state.isPanelOpen,

    /** Open the panel */
    open: () => dispatch({ type: 'OPEN_PANEL' }),

    /** Close the panel (no-op if already closed) */
    close: () => dispatch({ type: 'CLOSE_PANEL' }),
  };
}
