/**
 * @file PageTabs.tsx
 * @description Page navigation tabs for switching between visualization views
 *
 * This component renders the tab navigation for switching between different
 * visualization pages: Physical, Traffic/Services, VLAN Segmentation, and Rack.
 *
 * Features:
 * - Updates URL for deep linking when switching pages
 * - Highlights the currently active tab
 * - Shows tooltip description for each page
 * - Uses proper ARIA roles for accessibility
 *
 * Available Pages:
 * - Physical: LAN cables, switch ports, hardware specs
 * - Traffic/Services: Domain routing, Traefik, service config
 * - VLAN Segmentation: VLAN segments, membership, inter-VLAN ACL rules
 * - Rack Placement: Physical rack and device placement diagram
 *
 * @example
 * <PageTabs />
 *
 * @see AppHeader.tsx - Parent component
 * @see routing.ts - URL navigation utilities
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useActivePage } from '@/hooks/useActivePage';
import type { PageId } from '@/types/page';
import { PAGE_TABS } from '@/utils/page';
import { navigateTo } from '@/utils/routing';

import styles from './PageTabs.module.css';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Tab navigation component for switching between visualization pages.
 *
 * Derives active page from URL and renders a button for each available page.
 * Clicking a tab updates the URL (for deep linking/bookmarking).
 *
 * @returns {JSX.Element} Navigation element with tab buttons
 */
export function PageTabs() {
  const activePage = useActivePage();

  /**
   * Handle tab click - navigate to page via URL.
   *
   * @param {PageId} pageId - The page to switch to
   */
  function handleClick(pageId: PageId) {
    /* Update URL for deep linking (page is derived from URL) */
    navigateTo(pageId, null, null);
  }

  return (
    <nav className={styles.tabs} role="tablist">
      {PAGE_TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab}${activePage === tab.id ? ` ${styles.active}` : ''}`}
          role="tab"
          aria-selected={activePage === tab.id}
          title={tab.title}
          onClick={() => handleClick(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
