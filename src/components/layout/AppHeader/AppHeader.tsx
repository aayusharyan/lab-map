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
 *   ├─ <h1> App title (from settings)
 *   ├─ Tabs (page navigation)
 *   └─ HeaderActions (controls and status)
 *
 * @example
 * <AppHeader />
 *
 * @see Tabs - Generic tabs component
 * @see HeaderActions.tsx - Header controls and status
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useMemo } from 'react';

import { Tabs } from '@/components/Tabs';
import { useRoute } from '@/hooks/useRoute';
import { useSettingsValue } from '@/hooks/useSettings';
import { PAGES, PAGE_IDS, type PageId } from '@/utils/page';
import { navigateToPage } from '@/utils/routing';

import { HeaderActions } from './HeaderActions';

import type { TabItem } from '@/components/Tabs';

import styles from './AppHeader.module.css';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Main application header component.
 *
 * Renders the top navigation bar with:
 * - App title (from settings, defaults to "Lab Map")
 * - Page navigation tabs (Physical, Traffic, VLAN, Rack)
 * - Header actions section (settings)
 *
 * @returns Header element
 */
export function AppHeader() {
  const { appName } = useSettingsValue();
  const { page: activePage } = useRoute();
  const displayAppName = appName.trim() || 'Lab Map';

  /**
   * Convert page configuration to tab items.
   * Memoized since PAGES config is static.
   */
  const pageItems = useMemo<TabItem<PageId>[]>(
    () =>
      PAGE_IDS.map((pageId) => ({
        id: pageId,
        label: PAGES[pageId].label,
        title: PAGES[pageId].title,
      })),
    []
  );

  /**
   * Handle page tab selection.
   * Navigates via URL, clearing flow and selection when changing pages.
   */
  function handlePageSelect(pageId: PageId | null) {
    if (pageId) {
      navigateToPage(pageId);
    }
  }

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
      <Tabs<PageId>
        items={pageItems}
        activeId={activePage}
        onSelect={handlePageSelect}
        variant="header"
      />

      {/* Controls and status display */}
      <HeaderActions />
    </header>
  );
}
