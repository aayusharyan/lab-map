/**
 * @file HeaderActions.tsx
 * @description Header actions section
 *
 * This component renders the right section of the application header,
 * containing action buttons for the current view.
 *
 * Control Buttons:
 * - Settings: Opens the settings panel
 *
 * @example
 * <HeaderActions />
 *
 * @see AppHeader.tsx - Parent component
 * @see SettingsPanel.tsx - Settings panel with all preferences
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { IconSettings } from '@tabler/icons-react';

import { useSettingsPanel } from '@/hooks/useSettings';

import styles from './HeaderActions.module.css';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Header controls component with action buttons.
 *
 * Renders:
 * 1. Settings button to open settings panel
 *
 * @returns {JSX.Element} Header actions section
 */
export function HeaderActions() {
  /* ==========================================================================
   * HOOKS
   * ========================================================================== */

  const { open: openSettings } = useSettingsPanel();

  /* ==========================================================================
   * RENDER
   * ========================================================================== */

  return (
    <div className={styles.actions}>
      {/* ====================================================================
       * SETTINGS BUTTON
       * Opens the settings panel
       * ==================================================================== */}
      <button
        className={`btn-icon ${styles.settingsButton}`}
        title="Open settings"
        onClick={openSettings}
      >
        <IconSettings aria-hidden="true" stroke={1.8} />
      </button>
    </div>
  );
}
