/**
 * @file AppHeader.tsx
 * @description Application header bar with navigation and controls
 *
 * This component renders the main application header bar that appears at
 * the top of the screen. It contains the app title, page navigation tabs,
 * and header actions (settings).
 *
 * Component Structure:
 *   AppHeader
 *   ├─ <h1> "Lab Map" (app title)
 *   ├─ PageTabs (page navigation)
 *   └─ HeaderActions (controls and status)
 *
 * @example
 * <AppHeader />
 *
 * @see PageTabs.tsx - Page navigation tabs
 * @see HeaderActions.tsx - Header controls and status
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { HeaderActions } from './HeaderActions';
import { PageTabs } from './PageTabs';
import { useSettingsValue } from '@/hooks/useSettings';
import styles from './AppHeader.module.css';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Main application header component.
 *
 * Renders the top navigation bar with:
 * - App title ("Lab Map")
 * - Page navigation tabs (Physical, Traffic, VLAN, Rack)
 * - Header actions section (settings)
 *
 * @returns {JSX.Element} Header element
 */
export function AppHeader() {
  const { appName } = useSettingsValue();
  const displayAppName = appName || 'Lab Map';

  return (
    <header className={styles.header}>
      {/* Application title */}
      <h1 className={styles.title}>
        <img
          className={styles.logo}
          src="/favicon-192.png"
          alt=""
          aria-hidden="true"
        />
        <span>{displayAppName}</span>
      </h1>

      {/* Page navigation tabs */}
      <PageTabs />

      {/* Controls and status display */}
      <HeaderActions />
    </header>
  );
}
