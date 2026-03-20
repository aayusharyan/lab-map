/**
 * @file App.tsx
 * @description Root application component - manages layout and view switching
 *
 * This is the root component of the Lab Map application. It orchestrates the
 * main application layout and handles switching between different visualization
 * layers (Physical, Traffic, VLAN, Rack).
 *
 * Component Structure:
 *   App
 *   ├─ LoadingOverlay      (shown while data is loading)
 *   ├─ SettingsPanel       (settings modal/drawer)
 *   ├─ ValidationWarning   (data validation error banner)
 *   ├─ AppHeader           (navigation bar with layer tabs)
 *   └─ [Active Layer]      (one of the four layer components)
 *       ├─ PhysicalLayer   (network topology view)
 *       ├─ TrafficLayer    (traffic flow visualization)
 *       ├─ VlanLayer       (VLAN configuration view)
 *       └─ RackLayer       (physical rack layout)
 *
 * Each layer component manages its own:
 * - Canvas/visualization area (graph or rack diagram)
 * - Sidebar (node details, connection info)
 * - Footer (legend, status bar)
 *
 * Refs:
 * - graphRef: Allows AppHeader to control GraphView (fit, zoom, export)
 * - layoutRef: Allows AppHeader to control LayoutView (fit, zoom, export)
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useRef } from 'react';

import { GraphViewHandle } from '@/components/graph/GraphView';
import { PhysicalLayer } from '@/components/layers/PhysicalLayer';
import { RackLayer } from '@/components/layers/RackLayer';
import { TrafficLayer } from '@/components/layers/TrafficLayer';
import { VlanLayer } from '@/components/layers/VlanLayer';
import { AppHeader } from '@/components/layout/AppHeader';
import { LoadingOverlay } from '@/components/layout/LoadingOverlay';
import { ValidationWarning } from '@/components/layout/ValidationWarning';
import { LayoutViewHandle } from '@/components/layout-view/LayoutView';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { useAppContext } from '@/hooks/useAppContext';
import { useRouter } from '@/hooks/useRouter';
import { useTheme } from '@/hooks/useTheme';

/* ============================================================================
 * APP COMPONENT
 * ============================================================================ */

/**
 * Root application component.
 *
 * Responsibilities:
 * 1. Initialize theme (dark/light mode based on settings)
 * 2. Initialize routing (URL-based layer switching)
 * 3. Render global overlays (loading, settings, validation warnings)
 * 4. Render navigation header with layer tabs
 * 5. Conditionally render the active layer's visualization
 *
 * @returns {JSX.Element} The complete application UI
 */
export default function App() {
  /* ==========================================================================
   * CONTEXT & STATE
   * ========================================================================== */

  /**
   * Access global app state from context.
   * activeLayer determines which visualization is currently displayed.
   */
  const { state } = useAppContext();
  const { activeLayer } = state;

  /* ==========================================================================
   * REFS FOR IMPERATIVE ACTIONS
   * These refs allow the AppHeader to trigger actions on child components
   * (e.g., fit-to-screen, export as image, zoom controls)
   * ========================================================================== */

  /**
   * Reference to GraphView component (used by Physical, Traffic, VLAN layers).
   * Exposes methods: fitToScreen(), zoomIn(), zoomOut(), exportAsImage()
   */
  const graphRef = useRef<GraphViewHandle>(null);

  /**
   * Reference to LayoutView component (used by Rack layer).
   * Exposes methods: fitToScreen(), zoomIn(), zoomOut(), exportAsImage()
   */
  const layoutRef = useRef<LayoutViewHandle>(null);

  /* ==========================================================================
   * HOOKS INITIALIZATION
   * These hooks set up global behaviors that run once on mount
   * ========================================================================== */

  /**
   * Initialize theme management.
   * Applies dark/light mode class to document based on settings.
   */
  useTheme();

  /**
   * Initialize URL-based routing.
   * Syncs activeLayer with URL hash (e.g., #physical, #traffic).
   */
  useRouter();

  /* ==========================================================================
   * RENDER
   * ========================================================================== */

  return (
    <div className="app-shell">
      {/* ====================================================================
       * GLOBAL OVERLAYS
       * These components render above all other content when active
       * ==================================================================== */}

      {/* Loading spinner shown while topology data is being fetched */}
      <LoadingOverlay />

      {/* Settings panel (modal/drawer) for theme, font size, etc. */}
      <SettingsPanel />

      {/* Warning banner shown when data validation fails */}
      <ValidationWarning />

      {/* ====================================================================
       * NAVIGATION HEADER
       * Contains layer tabs, view controls, and settings button
       * ==================================================================== */}
      <AppHeader graphRef={graphRef} layoutRef={layoutRef} />

      {/* ====================================================================
       * LAYER CONTENT
       * Only one layer is rendered at a time based on activeLayer state.
       * Each layer component includes its own canvas, sidebar, and footer.
       * ==================================================================== */}

      {/* Physical network topology - shows nodes and connections */}
      {activeLayer === 'physical' && <PhysicalLayer graphRef={graphRef} />}

      {/* Traffic flow visualization - shows bandwidth and data flow */}
      {activeLayer === 'traffic' && <TrafficLayer graphRef={graphRef} />}

      {/* VLAN configuration view - shows VLAN assignments and segments */}
      {activeLayer === 'vlan' && <VlanLayer graphRef={graphRef} />}

      {/* Physical rack layout - shows device placement in server racks */}
      {activeLayer === 'rack' && <RackLayer layoutRef={layoutRef} />}
    </div>
  );
}
