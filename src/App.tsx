/**
 * Root application component that manages the main layout and view switching.
 * Renders global overlays and delegates to layer-specific components for canvas/sidebar/footer.
 */

import { useRef } from 'react';

import { GraphViewHandle } from '@/components/graph/GraphView';
import { AppHeader } from '@/components/layout/AppHeader';
import { LoadingOverlay } from '@/components/layout/LoadingOverlay';
import { ValidationWarning } from '@/components/layout/ValidationWarning';
import { PhysicalLayer } from '@/components/layers/PhysicalLayer';
import { RackLayer } from '@/components/layers/RackLayer';
import { TrafficLayer } from '@/components/layers/TrafficLayer';
import { VlanLayer } from '@/components/layers/VlanLayer';
import { LayoutViewHandle } from '@/components/rack/RackView';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from '@/hooks/useRouter';
import { useTheme } from '@/hooks/useTheme';

export default function App() {
  const { state } = useAppContext();
  const { activeLayer } = state;

  /* Refs allow AppHeader to trigger actions on GraphView/RackView (fit-to-screen, export, etc.) */
  const graphRef = useRef<GraphViewHandle>(null);
  const layoutRef = useRef<LayoutViewHandle>(null);

  /* Initialize theme (dark/light mode) and routing (URL-based layer switching from settings) */
  useTheme();
  useRouter();

  return (
    <div className="app-shell">
      {/* Global overlays and panels */}
      <LoadingOverlay />
      <SettingsPanel />
      <ValidationWarning />

      {/* Top navigation bar with layer switcher and actions */}
      <AppHeader graphRef={graphRef} layoutRef={layoutRef} />

      {/* Conditional layer rendering - each layer manages its own canvas, sidebar, and footer */}
      {activeLayer === 'physical' && <PhysicalLayer graphRef={graphRef} />}
      {activeLayer === 'traffic' && <TrafficLayer graphRef={graphRef} />}
      {activeLayer === 'vlan' && <VlanLayer graphRef={graphRef} />}
      {activeLayer === 'rack' && <RackLayer layoutRef={layoutRef} />}
    </div>
  );
}
