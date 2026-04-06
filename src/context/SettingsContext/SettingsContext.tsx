/**
 * @file SettingsContext.tsx
 * @description Settings state management for application preferences
 *
 * This file implements settings state management for the Lab Map application.
 * Settings use a bootstrap flow: localStorage first, then default_settings.json,
 * then hardcoded defaults.
 *
 * Settings Managed:
 * - appName: Custom application name shown in the header
 * - theme: Color theme (dark/light/system)
 * - defaultPage: Initial page shown on app load
 * - fontSize: App-wide font size for UI scaling
 * - scrollBehavior: Scroll wheel behavior mode on canvas (zoom/pan)
 * - showNodeLabels: Whether to display labels on nodes
 * - showLegend: Whether to display the legend
 * - showEdgeLabels: Whether to display labels on edges
 * - nodeAnimation: Whether graph nodes animate while the layout runs
 *
 * Data Flow:
 * 1. Read settings from localStorage synchronously on startup
 * 2. If no stored settings exist, bootstrap from default_settings.json
 * 3. If default_settings.json is unavailable, fall back to hardcoded defaults
 * 4. Persist the resolved settings to localStorage for future visits
 *
 * This allows default_settings.json to act as a first-run bootstrap source while
 * localStorage remains the long-term source of truth for returning users.
 *
 * @example
 * // Access settings in a component
 * const { state, dispatch } = useSettings();
 * const settings = useSettingsValue();
 * const { isOpen, open, close } = useSettingsPanel();
 *
 * @see SettingsContext.types.ts - Type definitions and context creation
 * @see useSettings.ts - Hook for consuming the context
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useReducer, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  SettingsContext,
  type AppSettings,
  type SettingsState,
  type SettingsAction,
} from './SettingsContext.types';
import { FONT_SIZES, type FontSize } from '@/types/font';
import type { ScrollBehavior } from '@/types/scroll';
import { isPageId } from '@/utils/page';
import { isThemeId, resolveTheme } from '@/utils/theme';

/* ============================================================================
 * DEFAULT SETTINGS
 * ============================================================================ */

/**
 * Default settings used as fallback when neither localStorage nor default_settings.json
 * provide a value.
 *
 * These defaults provide a reasonable out-of-the-box experience:
 * - System theme (clean default for broad compatibility, if the system theme is not available
 *   it will fall back to light theme)
 * - Physical page as default (most common starting point)
 * - Moderate font size
 * - All features enabled
 */
const DEFAULT_SETTINGS: AppSettings = {
  /** Default visualization page to show on app load */
  defaultPage: 'physical',

  /** App title shown in the header */
  appName: 'Lab Map',

  /** Color theme: 'dark', 'light', or 'system' */
  theme: 'system',

  /** App-wide font size in pixels (scales UI elements) */
  fontSize: 15,

  /** Scroll wheel behavior on canvas */
  scrollBehavior: 'zoom',

  /** Show labels on graph and layout nodes */
  showNodeLabels: true,

  /** Show the legend panel */
  showLegend: true,

  /** Show labels on graph edges */
  showEdgeLabels: true,

  /** Enable animated node movement in graph views */
  nodeAnimation: true,
};

/* ============================================================================
 * LOCALSTORAGE HELPERS
 * ============================================================================ */

/** localStorage keys for individual user preferences */
const STORAGE_KEYS: Record<keyof AppSettings, string> = {
  appName: 'lab-map-app-name',
  theme: 'lab-map-theme',
  defaultPage: 'lab-map-default-page',
  fontSize: 'lab-map-font-size',
  scrollBehavior: 'lab-map-scroll-behavior',
  showNodeLabels: 'lab-map-show-node-labels',
  showLegend: 'lab-map-show-legend',
  showEdgeLabels: 'lab-map-show-edge-labels',
  nodeAnimation: 'lab-map-node-animation',
};

/**
 * Load the stored settings from individual localStorage items.
 *
 * @returns {Partial<AppSettings>} Stored settings or empty object if none
 */
function loadUserPreferences(): Partial<AppSettings> {
  const prefs: Partial<AppSettings> = {};

  try {
    const appName = localStorage.getItem(STORAGE_KEYS.appName);
    if (appName !== null) {
      prefs.appName = sanitizeAppName(appName);
    }

    const theme = localStorage.getItem(STORAGE_KEYS.theme);
    if (theme && isThemeId(theme)) {
      prefs.theme = theme;
    }

    const defaultPage = localStorage.getItem(STORAGE_KEYS.defaultPage);
    if (defaultPage && isPageId(defaultPage)) {
      prefs.defaultPage = defaultPage;
    }

    const fontSizeStr = localStorage.getItem(STORAGE_KEYS.fontSize);
    if (fontSizeStr) {
      const parsed = parseInt(fontSizeStr, 10);
      if (FONT_SIZES.includes(parsed as FontSize)) {
        prefs.fontSize = parsed as FontSize;
      }
    }

    const scrollBehavior = localStorage.getItem(STORAGE_KEYS.scrollBehavior);
    if (scrollBehavior) prefs.scrollBehavior = coerceScrollBehavior(scrollBehavior);

    const storedNodeLabelVisibility = localStorage.getItem(STORAGE_KEYS.showNodeLabels);
    if (storedNodeLabelVisibility) prefs.showNodeLabels = storedNodeLabelVisibility === 'true';

    const storedLegendVisibility = localStorage.getItem(STORAGE_KEYS.showLegend);
    if (storedLegendVisibility) prefs.showLegend = storedLegendVisibility === 'true';

    const storedEdgeLabelVisibility = localStorage.getItem(STORAGE_KEYS.showEdgeLabels);
    if (storedEdgeLabelVisibility) prefs.showEdgeLabels = storedEdgeLabelVisibility === 'true';

    const nodeAnimation = localStorage.getItem(STORAGE_KEYS.nodeAnimation);
    if (nodeAnimation) prefs.nodeAnimation = nodeAnimation === 'true';
  } catch {
    /* Ignore storage errors */
  }

  return prefs;
}

/**
 * Persist the settings to individual localStorage items.
 *
 * @param {Partial<AppSettings>} settings - Settings snapshot to save
 */
function saveUserPreferences(settings: Partial<AppSettings>): void {
  try {
    if (settings.appName !== undefined)
      localStorage.setItem(STORAGE_KEYS.appName, sanitizeAppName(settings.appName));
    if (settings.theme) localStorage.setItem(STORAGE_KEYS.theme, settings.theme);
    if (settings.defaultPage) localStorage.setItem(STORAGE_KEYS.defaultPage, settings.defaultPage);
    if (settings.fontSize !== undefined)
      localStorage.setItem(STORAGE_KEYS.fontSize, String(settings.fontSize));
    if (settings.scrollBehavior !== undefined)
      localStorage.setItem(STORAGE_KEYS.scrollBehavior, settings.scrollBehavior);
    if (settings.showNodeLabels !== undefined)
      localStorage.setItem(STORAGE_KEYS.showNodeLabels, String(settings.showNodeLabels));
    if (settings.showLegend !== undefined)
      localStorage.setItem(STORAGE_KEYS.showLegend, String(settings.showLegend));
    if (settings.showEdgeLabels !== undefined)
      localStorage.setItem(STORAGE_KEYS.showEdgeLabels, String(settings.showEdgeLabels));
    if (settings.nodeAnimation !== undefined)
      localStorage.setItem(STORAGE_KEYS.nodeAnimation, String(settings.nodeAnimation));
  } catch {
    /* Ignore storage errors */
  }
}

/**
 * Merge settings with priority: localStorage (userPrefs) > fileDefaults > hardcodedDefaults.
 *
 * For each setting key, uses the first available value in this order:
 * 1. localStorage (persisted settings)
 * 2. default_settings.json (bootstrap defaults)
 * 3. DEFAULT_SETTINGS (hardcoded fallback)
 *
 * @param {Partial<AppSettings>} userPrefs - Settings from localStorage
 * @param {Partial<AppSettings>} fileDefaults - Settings from default_settings.json
 * @returns {AppSettings} Complete merged settings object
 */
function mergeSettings(
  userPrefs: Partial<AppSettings>,
  fileDefaults: Partial<AppSettings>
): AppSettings {
  return {
    defaultPage: userPrefs.defaultPage ?? fileDefaults.defaultPage ?? DEFAULT_SETTINGS.defaultPage,
    appName: sanitizeAppName(
      userPrefs.appName ?? fileDefaults.appName ?? DEFAULT_SETTINGS.appName
    ),
    theme: userPrefs.theme ?? fileDefaults.theme ?? DEFAULT_SETTINGS.theme,
    fontSize: coerceFontSize(
      userPrefs.fontSize ?? fileDefaults.fontSize ?? DEFAULT_SETTINGS.fontSize
    ),
    scrollBehavior: coerceScrollBehavior(
      userPrefs.scrollBehavior ?? fileDefaults.scrollBehavior ?? DEFAULT_SETTINGS.scrollBehavior
    ),
    showNodeLabels: userPrefs.showNodeLabels ?? fileDefaults.showNodeLabels ?? DEFAULT_SETTINGS.showNodeLabels,
    showLegend: userPrefs.showLegend ?? fileDefaults.showLegend ?? DEFAULT_SETTINGS.showLegend,
    showEdgeLabels: userPrefs.showEdgeLabels ?? fileDefaults.showEdgeLabels ?? DEFAULT_SETTINGS.showEdgeLabels,
    nodeAnimation:
      userPrefs.nodeAnimation ?? fileDefaults.nodeAnimation ?? DEFAULT_SETTINGS.nodeAnimation,
  };
}

function sanitizeAppName(value: unknown): string {
  const text = typeof value === 'string' ? value : '';
  const normalized = text.replace(/[\u0000-\u001F\u007F]/g, '');
  return normalized;
}

function coerceFontSize(value: unknown): FontSize {
  return FONT_SIZES.includes(value as FontSize)
    ? (value as FontSize)
    : DEFAULT_SETTINGS.fontSize;
}

function coerceScrollBehavior(value: unknown): ScrollBehavior {
  return value === 'pan' || value === 'zoom'
    ? value
    : DEFAULT_SETTINGS.scrollBehavior;
}

/* ============================================================================
 * INITIAL STATE
 * ============================================================================ */

/**
 * Build the initial reducer state from localStorage when available.
 *
 * This keeps the first render in sync with the last persisted settings while
 * hiding the bootstrap phase from context consumers.
 *
 * Note: This function only loads from localStorage, not default_settings.json,
 * because it's called synchronously during useState initialization.
 * File loading requires fetch() which is async and cannot be used here.
 * The async default_settings.json bootstrap happens in the useEffect inside
 * SettingsProvider for first-time visitors without localStorage data.
 *
 * @returns {object} Initial reducer state plus bootstrap metadata
 */
function createInitialSettingsState(): {
  state: SettingsState;
  isStoredSettingsAvailable: boolean;
} {
  const userPrefs = loadUserPreferences();
  const isStoredSettingsAvailable = Object.keys(userPrefs).length > 0;

  return {
    state: {
      settings: mergeSettings(userPrefs, {}),
      isPanelOpen: false,
    },
    isStoredSettingsAvailable,
  };
}

/* ============================================================================
 * REDUCER
 * ============================================================================ */

/**
 * Pure reducer function for settings state transitions.
 *
 * All state updates are immutable (return new objects).
 * Handles bootstrap updates and individual setting updates.
 *
 * @param {SettingsState} state - Current settings state
 * @param {SettingsAction} action - Action to process
 * @returns {SettingsState} New state after applying the action
 */
function reducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    /* ========================================================================
     * INITIALIZATION
     * ======================================================================== */

    /**
     * Load resolved settings into state after bootstrap.
     */
    case 'LOAD_SETTINGS':
      return {
        ...state,
        settings: mergeSettings(action.settings, {}),
      };

    /* ========================================================================
     * INDIVIDUAL SETTING UPDATES
     * ======================================================================== */

    /**
     * Change app title shown in the header.
     */
    case 'SET_APP_NAME':
      return {
        ...state,
        settings: { ...state.settings, appName: sanitizeAppName(action.appName) },
      };

    /**
     * Change color theme preference.
     */
    case 'SET_THEME':
      return { ...state, settings: { ...state.settings, theme: action.theme } };

    /**
     * Change default page shown on app load.
     */
    case 'SET_DEFAULT_PAGE':
      return { ...state, settings: { ...state.settings, defaultPage: action.page } };

    /**
     * Change app-wide font size.
     */
    case 'SET_FONT_SIZE':
      return { ...state, settings: { ...state.settings, fontSize: action.size } };

    /**
     * Change scroll wheel behavior mode.
     */
    case 'SET_SCROLL_BEHAVIOR':
      return { ...state, settings: { ...state.settings, scrollBehavior: action.scrollBehavior } };

    /**
     * Toggle node label visibility.
     */
    case 'SET_NODE_LABEL_VISIBILITY':
      return { ...state, settings: { ...state.settings, showNodeLabels: action.isVisible } };

    /**
     * Toggle legend visibility.
     */
    case 'SET_LEGEND_VISIBILITY':
      return { ...state, settings: { ...state.settings, showLegend: action.isVisible } };

    /**
     * Toggle edge label visibility.
     */
    case 'SET_EDGE_LABEL_VISIBILITY':
      return { ...state, settings: { ...state.settings, showEdgeLabels: action.isVisible } };

    /**
     * Toggle animated node movement in graph view.
     */
    case 'SET_NODE_ANIMATION':
      return {
        ...state,
        settings: {
          ...state.settings,
          nodeAnimation: action.isEnabled,
        },
      };

    /* ========================================================================
     * PANEL STATE
     * ======================================================================== */

    /**
     * Open settings panel.
     */
    case 'OPEN_PANEL':
      return { ...state, isPanelOpen: true };

    /**
     * Close settings panel.
     */
    case 'CLOSE_PANEL':
      return { ...state, isPanelOpen: false };

    /* ========================================================================
     * DEFAULT CASE
     * ======================================================================== */
    default:
      return state;
  }
}

/* ============================================================================
 * PROVIDER COMPONENT
 * ============================================================================ */

/**
 * Provider component that wraps the app.
 *
 * Initializes settings from localStorage when available and otherwise
 * bootstraps them from default_settings.json before rendering children.
 *
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element | null} Provider component with children once ready
 *
 * @example
 * // In main.tsx (should wrap AppProvider)
 * <SettingsProvider>
 *   <AppProvider>
 *     <App />
 *   </AppProvider>
 * </SettingsProvider>
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  /**
   * Compute the startup snapshot once for this provider instance.
   */
  const [{ state: initialState, isStoredSettingsAvailable }] = useState(createInitialSettingsState);

  /**
   * Initialize reducer with the resolved startup state.
   */
  const [state, dispatch] = useReducer(reducer, initialState);

  /**
   * Internal bootstrap flag used to hide async initialization from consumers.
   */
  const [isBootstrapping, setIsBootstrapping] = useState(!isStoredSettingsAvailable);

  /**
   * Bootstrap default_settings.json only for first-run visits without localStorage.
   */
  useEffect(() => {
    if (isStoredSettingsAvailable) return;

    const loadBootstrapSettings = async () => {
      const res = await fetch('/data/default_settings.json');
      if (!res.ok) throw new Error('Failed to load /data/default_settings.json');
      return res.json();
    };

    loadBootstrapSettings()
      .then((fileDefaults) => {
        const merged = mergeSettings({}, fileDefaults);
        dispatch({ type: 'LOAD_SETTINGS', settings: merged });
      })
      .catch(() => {
        const merged = mergeSettings({}, {});
        dispatch({ type: 'LOAD_SETTINGS', settings: merged });
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, [isStoredSettingsAvailable]);

  /**
   * Sync theme to DOM once bootstrap is complete.
   *
   * This ensures the theme is applied immediately after the provider hydrates.
   */
  useEffect(() => {
    if (isBootstrapping) return;

    document.documentElement.setAttribute('data-theme', resolveTheme(state.settings.theme));
  }, [isBootstrapping, state.settings.theme]);

  /**
   * Persist settings to localStorage after bootstrap.
   */
  useEffect(() => {
    if (isBootstrapping) return;

    saveUserPreferences(state.settings);
  }, [isBootstrapping, state.settings]);

  /**
   * Memoize context value to prevent unnecessary re-renders.
   */
  const value = useMemo(() => ({ state, dispatch }), [state]);

  if (isBootstrapping) {
    return null;
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
