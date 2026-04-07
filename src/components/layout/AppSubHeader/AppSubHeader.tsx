/**
 * @file AppSubHeader.tsx
 * @description Secondary header bar for page-specific controls
 *
 * This component renders a subheader bar between AppHeader and page content.
 * Content varies by page:
 * - Traffic: Flow filter pills (URL-driven)
 * - Physical/VLAN/Rack: No subheader (returns null)
 *
 * Data Flow:
 * - Loads traffic.json independently for flows list (browser caches request)
 * - Derives active sub-page from URL via useRouter hook
 * - Navigates via navigateTo(), updating URL to change flow filter
 *
 * Component Structure:
 *   AppSubHeader
 *   └─ bar (container)
 *      └─ Tabs (pill variant with "All flows" option)
 *
 * @see useRouter.ts - Central routing hook for URL state
 * @see routing.ts - Navigation utilities
 * @see Tabs - Generic tabs component used for flow pills
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useState, useEffect, useMemo } from 'react';

import { Tabs } from '@/components/Tabs';
import { useActivePage } from '@/hooks/useActivePage';
import { useRouter } from '@/hooks/useRouter';
import { navigateTo } from '@/utils/routing';

import type { TabItem } from '@/components/Tabs';
import type { Flow } from '@/types/topology';

import styles from './AppSubHeader.module.css';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * AppSubHeader component - secondary header for page-specific filters.
 *
 * Renders a subheader bar with content based on the active page:
 * - Traffic page: Flow filter pills using generic Tabs component
 * - Other pages: Nothing (returns null)
 *
 * @returns Subheader element or null for non-traffic pages
 */
export function AppSubHeader() {
  const activePage = useActivePage();
  const { subPageId } = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);

  /**
   * Load traffic flows when on traffic page.
   * This is independent from TrafficPage's data load - browser caches the request.
   */
  useEffect(() => {
    if (activePage !== 'traffic') {
      setFlows([]);
      return;
    }

    fetch('/data/traffic.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load traffic data');
        return res.json();
      })
      .then((data) => {
        setFlows(data.flows || []);
      })
      .catch(() => {
        setFlows([]);
      });
  }, [activePage]);

  /**
   * Convert flows to tab items for the Tabs component.
   * Memoized to avoid recreating on every render.
   */
  const flowItems = useMemo<TabItem<string>[]>(
    () => flows.map((f) => ({ id: f.id, label: f.label })),
    [flows]
  );

  /* Only render for traffic page */
  if (activePage !== 'traffic') {
    return null;
  }

  /**
   * Handle flow selection.
   * Navigates to new flow URL, clearing any existing selection.
   *
   * @param newFlowId - Flow ID to select, or null for "all flows"
   */
  function handleFlowChange(newFlowId: string | null) {
    navigateTo('traffic', newFlowId, null, null);
  }

  return (
    <div className={styles.bar}>
      <Tabs<string>
        items={flowItems}
        activeId={subPageId}
        onSelect={handleFlowChange}
        variant="pill"
        allOption={{ label: 'All flows' }}
      />
    </div>
  );
}
