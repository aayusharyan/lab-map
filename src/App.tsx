/**
 * @file App.tsx
 * @description Root application component - manages layout and view switching
 *
 * This is the root component of the Lab Map application. It orchestrates the
 * main application layout and handles switching between different visualization
 * pages (Physical, Traffic, VLAN, Rack).
 *
 * Component Structure:
 *   App
 *   ├─ SettingsPanel       (settings modal/drawer)
 *   ├─ AppHeader           (navigation bar with page tabs)
 *   └─ [Active Page]      (one of the four page components)
 *       ├─ PhysicalPage   (network topology view)
 *       ├─ TrafficPage    (traffic flow visualization)
 *       ├─ VlanPage       (VLAN configuration view)
 *       └─ RackPage       (physical rack layout)
 *
 * Each page component manages its own:
 * - Canvas/visualization area (graph or layout)
 * - Sidebar (node details, connection info)
 * - Footer (legend, status bar)
 *
 * Refs:
 * - graphRef: Passed to page components for external GraphView control (focusNode)
 * - layoutRef: Passed to RackPage/LayoutView for export actions
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useRef } from 'react';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSubHeader } from '@/components/layout/AppSubHeader';
import { SettingsPanel } from '@/components/layout/SettingsPanel';
import { GraphViewHandle } from '@/components/views/graphView/GraphView';
import { LayoutViewHandle } from '@/components/views/layoutView/LayoutView';
import { useRoute } from '@/hooks/useRoute';
import { useTheme } from '@/hooks/useTheme';
import { useValidationPolling } from '@/hooks/useValidationPolling';
import { PhysicalPage } from '@/pages/PhysicalPage';
import { RackPage } from '@/pages/RackPage';
import { TrafficPage } from '@/pages/TrafficPage';
import { VlanPage } from '@/pages/VlanPage';

/* ============================================================================
 * APP COMPONENT
 * ============================================================================ */

/**
 * Root application component.
 *
 * Responsibilities:
 * 1. Initialize theme (dark/light/system mode based on settings)
 * 2. Initialize routing (URL-based page switching)
 * 3. Render global overlays (settings)
 * 4. Render navigation header with page tabs
 * 5. Conditionally render the active page's visualization
 *
 * @returns {JSX.Element} The complete application UI
 */
export default function App() {
  /* ==========================================================================
   * STATE FROM URL
   * ========================================================================== */

  /**
   * Derive active page from URL.
   * activePage determines which visualization is currently displayed.
   * useRoute also handles root URL redirect to default page.
   */
  const { page: activePage } = useRoute();

  /* ==========================================================================
   * REFS FOR IMPERATIVE ACTIONS
   * These refs allow the AppHeader to trigger actions on child components
   * (e.g., fit-to-screen, export as image, zoom controls)
   * ========================================================================== */

  /**
   * Reference to GraphView component (used by Physical, Traffic, VLAN pages).
   * Exposes methods: fitGraph(), focusNode(nodeId)
   */
  const graphRef = useRef<GraphViewHandle>(null);

  /**
   * Reference to LayoutView component (used by Rack page).
   * Exposes methods: exportJSON()
   */
  const layoutRef = useRef<LayoutViewHandle>(null);

  /* ==========================================================================
   * HOOKS INITIALIZATION
   * These hooks set up global behaviors that run once on mount
   * ========================================================================== */

  /**
   * Initialize theme management.
   * Applies the resolved theme to the document based on settings.
   */
  useTheme();


  /**
   * Poll validation metadata and dispatch notifications.
   * Checks all data files every 2 seconds when page is visible.
   */
  useValidationPolling();

  /* ==========================================================================
   * RENDER
   * ========================================================================== */

  return (
    <div className="app-shell">
      {/* ====================================================================
       * GLOBAL OVERLAYS
       * These components render above all other content when active
       * ==================================================================== */}

      {/* Settings panel (modal/drawer) for theme, font size, etc. */}
      <SettingsPanel />

      {/* ====================================================================
       * NAVIGATION HEADER
       * Contains page tabs, view controls, and settings button
       * ==================================================================== */}
      <AppHeader />

      {/* ====================================================================
       * SUB HEADER
       * Page-specific secondary header (e.g., flow pills on traffic page)
       * ==================================================================== */}
      <AppSubHeader />

      {/* ====================================================================
       * LAYER CONTENT
       * Only one page is rendered at a time based on activePage state.
       * Each page component includes its own canvas, sidebar, and footer.
       * ==================================================================== */}

      {/* Physical network topology - shows nodes and connections */}
      {activePage === 'physical' && <PhysicalPage graphRef={graphRef} />}

      {/* Traffic flow visualization - shows bandwidth and data flow */}
      {activePage === 'traffic' && <TrafficPage graphRef={graphRef} />}

      {/* VLAN configuration view - shows VLAN assignments and segments */}
      {activePage === 'vlan' && <VlanPage graphRef={graphRef} />}

      {/* Physical rack layout - shows device placement in server racks */}
      {activePage === 'rack' && <RackPage layoutRef={layoutRef} />}
    </div>
  );
}
