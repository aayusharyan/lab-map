/**
 * @file SettingsPanel.tsx
 * @description Settings panel overlay for user-configurable app preferences
 *
 * This component renders a slide-in settings panel that updates
 * SettingsContext-backed preferences (persisted to localStorage).
 *
 * Available Settings:
 * - App Name: Header title text
 * - Theme: Dark/Light/System mode dropdown
 * - Default Page: Initial page on load
 * - Font Size: App wide font size adjustment
 * - Scroll Wheel Behavior: Wheel interaction mode (zoom/pan) on canvas views
 * - Node Animation: Enable/disable animated node movement
 * - Node Labels: Node label visibility
 * - Edge Labels: Edge label visibility
 * - Legend: Legend panel visibility
 *
 * The panel is displayed as an overlay with a dismissible backdrop.
 * Clicking the backdrop or close button dismisses the panel.
 *
 * @example
 * <SettingsPanel />
 *
 * @see HeaderActions.tsx - Contains settings button
 * @see useSettings.ts - Settings state management
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useFontSize } from '@/hooks/useFontSize';
import { useSettingsOrThrow, useSettingsPanel } from '@/hooks/useSettings';
import type { ScrollBehavior } from '@/context/SettingsContext';
import { IconX } from '@tabler/icons-react';
import { PAGES, PAGE_IDS, type PageId } from '@/utils/page';
import { THEMES, THEME_IDS, type ThemeId } from '@/utils/theme';

import '@/styles/components/font-size-control.css';
import styles from './SettingsPanel.module.css';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * SettingsPanel component - settings overlay with form controls.
 *
 * Renders a slide-in panel with various preference controls.
 * Changes update SettingsContext, which handles persistence and UI preferences.
 *
 * @returns {JSX.Element} Settings panel element
 */
export function SettingsPanel() {
  const { state: settingsState, dispatch: settingsDispatch } = useSettingsOrThrow();
  const { isOpen, close } = useSettingsPanel();

  /**
   * Most preference values are read from this single settings object.
   * Imported types (ThemeId/ScrollBehavior) are used only for select value casts,
   * while font size adjustments are handled via the dedicated useFontSize hook.
   */
  const { settings } = settingsState;
  const { fontSize, increment, decrement, isIncrementAllowed, isDecrementAllowed } = useFontSize();

 /**
   * Update the app name shown in the header.
   *
   * @param {string} appName - User-provided app name
   */
  const handleAppNameChange = (appName: string) => {
    settingsDispatch({ type: 'SET_APP_NAME', appName });
  };

  /**
   * Update theme preference.
   *
   * @param {ThemeId} theme - Selected theme mode
   */
  const handleThemeChange = (theme: ThemeId) => {
    settingsDispatch({ type: 'SET_THEME', theme });
  };

  /**
   * Update default page shown on app load.
   *
   * @param {PageId} page - Selected page id
   */
  const handleDefaultPageChange = (page: PageId) => {
    settingsDispatch({ type: 'SET_DEFAULT_PAGE', page });
  };

  /**
   * Update scroll wheel behavior for canvas views.
   *
   * @param {ScrollBehavior} scrollBehavior - Wheel mode ('zoom' or 'pan')
   */
  const handleScrollBehaviorChange = (scrollBehavior: ScrollBehavior) => {
    settingsDispatch({ type: 'SET_SCROLL_BEHAVIOR', scrollBehavior });
  };

  /**
   * Update node label visibility on graph and layout views.
   *
   * @param {boolean} isNodeLabelsVisible - Whether node labels are visible
   */
  const handleNodeLabelVisibilityChange = (isNodeLabelsVisible: boolean) => {
    settingsDispatch({ type: 'SET_NODE_LABEL_VISIBILITY', isVisible: isNodeLabelsVisible });
  };

  /**
   * Update edge label visibility on graph.
   *
   * @param {boolean} isEdgeLabelsVisible - Whether edge labels are visible
   */
  const handleEdgeLabelVisibilityChange = (isEdgeLabelsVisible: boolean) => {
    settingsDispatch({ type: 'SET_EDGE_LABEL_VISIBILITY', isVisible: isEdgeLabelsVisible });
  };

  /**
   * Update legend visibility in the sidebar.
   *
   * @param {boolean} isLegendVisible - Whether the legend is visible
   */
  const handleLegendVisibilityChange = (isLegendVisible: boolean) => {
    settingsDispatch({ type: 'SET_LEGEND_VISIBILITY', isVisible: isLegendVisible });
  };

  /**
   * Update node animation setting.
   *
   * @param {boolean} isNodeAnimationEnabled - Whether node animation is enabled
   */
  const handleNodeAnimationChange = (isNodeAnimationEnabled: boolean) => {
    settingsDispatch({ type: 'SET_NODE_ANIMATION', isEnabled: isNodeAnimationEnabled });
  };

  return (
    <div className={`${styles.overlay}${isOpen ? ` ${styles.open}` : ''}`}>
      {/* Backdrop - clicking dismisses panel */}
      <div className={styles.backdrop} onClick={close} />

      <div className={styles.panel}>
        {/* Header with title and close button */}
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.close} onClick={close} title="Close settings">
            <IconX aria-hidden="true" stroke={1.8} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Settings info notice */}
          <p className={styles.note}>
            Settings persist in this browser, including page refreshes. For global defaults, edit `settings.json`.
          </p>

          {/* App name input */}
          <div className={styles.group}>
            <label className={styles.label}>App Name</label>
            <input
              className={styles.input}
              type="text"
              value={settings.appName}
              maxLength={80}
              onChange={(e) => handleAppNameChange(e.target.value)}
              placeholder="Lab Map"
            />
          </div>

          {/* Theme dropdown */}
          <div className={`${styles.group} ${styles.inlineSetting}`}>
            <label className={styles.label}>Theme</label>
            <select
              className={`${styles.select} ${styles.inlineSelect}`}
              value={settings.theme}
              onChange={(e) => handleThemeChange(e.target.value as ThemeId)}
            >
              {/* Iterate with canonical IDs for stable order + ThemeId-safe values. */}
              {THEME_IDS.map((themeId) => (
                <option key={themeId} value={themeId}>
                  {THEMES[themeId].label}
                </option>
              ))}
            </select>
          </div>

          {/* Default page dropdown */}
          <div className={`${styles.group} ${styles.inlineSetting}`}>
            <label className={styles.label}>Default Page</label>
            <select
              className={`${styles.select} ${styles.inlineSelect}`}
              value={settings.defaultPage}
              onChange={(e) => handleDefaultPageChange(e.target.value as PageId)}
            >
              {/* Iterate with canonical IDs for stable order + PageId-safe values. */}
              {PAGE_IDS.map((pageId) => (
                <option key={pageId} value={pageId}>
                  {PAGES[pageId].label}
                </option>
              ))}
            </select>
          </div>

          {/* Font size adjustment */}
          <div className={`${styles.group} ${styles.inlineSetting}`}>
            <label className={styles.label}>Font Size</label>
            <div className={`font-size-ctrl ${styles.fontCtrl}`}>
              <button
                className="btn-icon btn-font"
                title="Decrease font size"
                disabled={!isDecrementAllowed}
                onClick={decrement}
              >A−</button>
              <span className="font-size-val">{fontSize}</span>
              <button
                className="btn-icon btn-font"
                title="Increase font size"
                disabled={!isIncrementAllowed}
                onClick={increment}
              >A+</button>
            </div>
          </div>

          {/* Scroll wheel behavior selector */}
          <div className={`${styles.group} ${styles.inlineSetting}`}>
            <label className={styles.label}>Scroll Wheel Behavior</label>
            <select
              className={`${styles.select} ${styles.inlineSelect}`}
              value={settings.scrollBehavior}
              onChange={(e) => handleScrollBehaviorChange(e.target.value as ScrollBehavior)}
            >
              <option value="zoom">Zoom</option>
              <option value="pan">Pan/Scroll</option>
            </select>
          </div>

          {/* Node animation toggle */}
          <div className={`${styles.group} ${styles.inlineSetting}`}>
            <label className={styles.label}>Animate Nodes</label>
            <label className={styles.switchControl}>
              <input
                className={styles.switchInput}
                type="checkbox"
                role="switch"
                checked={settings.nodeAnimation}
                onChange={(e) => handleNodeAnimationChange(e.target.checked)}
                aria-label="Toggle node animation"
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
            </label>
          </div>

          {/* Node labels toggle */}
          <div className={`${styles.group} ${styles.inlineSetting}`}>
            <label className={styles.label}>Show Node Labels</label>
            <label className={styles.switchControl}>
              <input
                className={styles.switchInput}
                type="checkbox"
                role="switch"
                checked={settings.showNodeLabels}
                onChange={(e) => handleNodeLabelVisibilityChange(e.target.checked)}
                aria-label="Toggle node label visibility"
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
            </label>
          </div>

          {/* Edge labels toggle */}
          <div className={`${styles.group} ${styles.inlineSetting}`}>
            <label className={styles.label}>Show Edge Labels</label>
            <label className={styles.switchControl}>
              <input
                className={styles.switchInput}
                type="checkbox"
                role="switch"
                checked={settings.showEdgeLabels}
                onChange={(e) => handleEdgeLabelVisibilityChange(e.target.checked)}
                aria-label="Toggle edge label visibility"
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
            </label>
          </div>

          {/* Legend visibility toggle */}
          <div className={`${styles.group} ${styles.inlineSetting}`}>
            <label className={styles.label}>Show Legend</label>
            <label className={styles.switchControl}>
              <input
                className={styles.switchInput}
                type="checkbox"
                role="switch"
                checked={settings.showLegend}
                onChange={(e) => handleLegendVisibilityChange(e.target.checked)}
                aria-label="Toggle legend visibility"
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
