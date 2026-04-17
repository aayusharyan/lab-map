/**
 * @file VlanPage.tsx
 * @description VLAN page view container component
 *
 * This component renders the VLAN (Virtual LAN) page view. It shows
 * the logical network segmentation with VLANs displayed as cluster
 * nodes that group their member devices.
 *
 * The VLAN page helps visualize network segmentation, showing which
 * devices belong to which broadcast domain, along with subnet and
 * gateway information for each VLAN.
 *
 * Component Structure:
 *   VlanPage
 *   ├─ app-body (container)
 *   │  └─ app-content (flex layout)
 *   │     ├─ graph-area (main content)
 *   │     │  ├─ GraphView (network graph with VLAN clusters)
 *   │     │  └─ app-footer (footer with page description + GitHub link)
 *   │     └─ Sidebar (right panel)
 *
 * Data Loading:
 * - Loads vlan.json data on mount via local state (fresh load every time)
 * - VLAN clustering is handled by GraphView
 *
 * @example
 * const graphRef = useRef<GraphViewHandle>(null);
 *
 * <VlanPage graphRef={graphRef} />
 *
 * @see GraphView.tsx - Network graph component (handles VLAN cluster expand/collapse)
 * @see Sidebar.tsx - Side panel with node details
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { type RefObject, type Ref, useEffect, useState, useCallback, useMemo } from 'react';

import { Footer } from '@/components/footer';
import { PageLoading } from '@/components/PageLoading';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { GraphView, type GraphViewHandle } from '@/components/views/graphView/GraphView';
import type { GraphPhysics } from '@/components/views/graphView/GraphView.types';
import { useRoute } from '@/hooks/useRoute';
import { loadPageDataOrThrow } from '@/utils/data';
import type { PageData } from '@/utils/page';



/* ============================================================================
 * PAGE CONFIGURATION
 * Inline config for VLAN page (physics, labels, types)
 * ============================================================================ */

/** Page label for sidebar badge */
const PAGE_LABEL = "VLAN Segmentation";

/** Page description for footer and sidebar */
const PAGE_DESCRIPTION = "Each VLAN is a collapsed cluster. Click to select and see config. Double-click to expand and see member nodes. Inter-VLAN edges show firewall rules.";

/** vis-network physics configuration */
const PAGE_PHYSICS: GraphPhysics = {
  enabled: true,
  solver: "forceAtlas2Based",
  forceAtlas2Based: { gravitationalConstant: -110, centralGravity: 0.015, springLength: 180, springConstant: 0.06, damping: 0.9 },
  stabilization: { iterations: 300, updateInterval: 25 },
};

/** Valid node types for this page (determines legend items) */
const PAGE_NODE_TYPES = ["generic-internet-1", "desktop-compute-1", "server-rack-1u-compute-1", "server-rack-1u-nas-hdd-1", "server-rack-2u-compute-1", "server-rack-2u-nas-hdd-1", "server-rack-2u-nas-ssd-1"];

/** Valid edge types for this page (determines legend items) */
const PAGE_EDGE_TYPES = ["wan", "member", "intervlan", "gateway-link"];

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Props for VlanPage component.
 *
 * @property {RefObject<GraphViewHandle | null>} graphRef - Ref to GraphView for fit/zoom actions
 */
interface Props {
  graphRef: RefObject<GraphViewHandle | null>;
}

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * VlanPage component - VLAN topology view.
 *
 * Renders the VLAN page with:
 * - GraphView for network visualization with VLAN clustering
 * - Footer with page description and GitHub link
 * - Sidebar for node details and filters
 *
 * Loads vlan.json data on mount (fresh load every time for animations).
 *
 * @param {Props} props - Component props
 * @returns {JSX.Element} VLAN page view element
 */
export function VlanPage({ graphRef }: Props) {
  /* ===== Route State ===== */
  const { selectionType, selectionId } = useRoute();

  /* ===== Local State ===== */
  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load VLAN page data.
   * Wrapped in useCallback to maintain stable reference.
   */
  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pageData = await loadPageDataOrThrow('vlan');
      setData(pageData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load VLAN page data on mount.
   * Always loads fresh to trigger animations.
   */
  useEffect(() => {
    loadPage();
  }, [loadPage]);

  /* Extract nodes and edges from loaded data */
  const nodes = data?.nodes || [];
  const edges = data?.edges || [];

  /* Log error to console (UI shows loading spinner on error for now) */
  if (error) {
    console.error('VlanPage load error:', error);
  }

  /* Derive selection from URL-driven route state and loaded data */
  const { selectedNode, selectedEdge } = useMemo(() => {
    if (!selectionType || !selectionId) {
      return { selectedNode: null, selectedEdge: null };
    }

    if (selectionType === 'node') {
      return { selectedNode: nodes.find(n => n.id === selectionId) ?? null, selectedEdge: null };
    }

    if (selectionType === 'edge') {
      return { selectedNode: null, selectedEdge: edges.find(e => e.id === selectionId) ?? null };
    }

    return { selectedNode: null, selectedEdge: null };
  }, [selectionType, selectionId, nodes, edges]);

  return (
    <div className="app-body">
      <div className="app-content">
        {/* Main graph area */}
        <main className="canvas-area">
          {isLoading ? (
            <PageLoading message="Loading VLAN topology…" />
          ) : (
            <GraphView ref={graphRef as unknown as Ref<GraphViewHandle>} nodes={nodes} edges={edges} physics={PAGE_PHYSICS} activePage="vlan" />
          )}

          <Footer description={PAGE_DESCRIPTION} />
        </main>

        {/* Right sidebar with node details and filters */}
        <Sidebar
          graphRef={graphRef}
          nodes={nodes}
          edges={edges}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          pageLabel={PAGE_LABEL}
          nodeTypes={PAGE_NODE_TYPES}
          edgeTypes={PAGE_EDGE_TYPES}
        />
      </div>
    </div>
  );
}
