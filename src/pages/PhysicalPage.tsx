/**
 * @file PhysicalPage.tsx
 * @description Physical page view container component
 *
 * This component renders the physical network topology page view.
 * It serves as a container that assembles the graph visualization,
 * sidebar, and footer elements for the physical page.
 *
 * The physical page shows the actual physical connections between
 * network devices (routers, switches, servers, etc.) without any
 * logical overlays or traffic flow information.
 *
 * Component Structure:
 *   PhysicalPage
 *   ├─ app-body (container)
 *   │  └─ app-content (flex layout)
 *   │     ├─ graph-area (main content)
 *   │     │  ├─ GraphView (network graph)
 *   │     │  └─ app-footer (footer with page description + GitHub link)
 *   │     └─ Sidebar (right panel)
 *
 * Data Flow:
 * - Loads physical.json data on mount via local state
 * - Data is stored in component state and passed to children as props
 * - Fresh load every time for animations
 *
 * @example
 * const graphRef = useRef<GraphViewHandle>(null);
 *
 * <PhysicalPage graphRef={graphRef} />
 *
 * @see GraphView.tsx - Network graph component
 * @see Sidebar.tsx - Side panel with node details
 * @see nodeType.ts - Canonical node type style/source-of-truth definitions
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
 * Inline config for physical page (physics, labels, types)
 * ============================================================================ */

/** Page label for sidebar badge */
const PAGE_LABEL = "Physical";

/** Page description for footer and sidebar */
const PAGE_DESCRIPTION = "LAN cabling and switch port connections. Click a node to see hardware specs and NIC wiring.";

/** vis-network physics configuration */
const PAGE_PHYSICS: GraphPhysics = {
  enabled: true,
  solver: "forceAtlas2Based",
  forceAtlas2Based: { gravitationalConstant: -120, centralGravity: 0.01, springLength: 120, springConstant: 0.08, damping: 0.9 },
  stabilization: { iterations: 300, updateInterval: 25 },
};

/** Valid node types for this page (determines legend items) */
const PAGE_NODE_TYPES = ["generic-internet-1", "desktop-router-1", "desktop-compute-1", "server-rack-1u-router-1", "server-rack-1u-switch-1", "server-rack-1u-compute-1", "server-rack-1u-nas-hdd-1", "server-rack-2u-compute-1", "server-rack-2u-nas-hdd-1", "server-rack-2u-nas-ssd-1"];

/** Valid edge types for this page (determines legend items) */
const PAGE_EDGE_TYPES = ["wan", "trunk", "access"];

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Props for PhysicalPage component.
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
 * PhysicalPage component - physical network topology view.
 *
 * Renders the physical page with:
 * - GraphView for network visualization
 * - Footer with page description and GitHub link
 * - Sidebar for node details and filters
 *
 * Loads physical.json data on mount (fresh load every time for animations).
 *
 * @param {Props} props - Component props
 * @returns {JSX.Element} Physical page view element
 */
export function PhysicalPage({ graphRef }: Props) {
  /* ===== Route State ===== */
  const { selectionType, selectionId } = useRoute();

  /* ===== Local State ===== */
  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load physical page data.
   * Wrapped in useCallback to maintain stable reference.
   */
  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pageData = await loadPageDataOrThrow('physical');
      setData(pageData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load physical page data on mount.
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
    console.error('PhysicalPage load error:', error);
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
            <PageLoading message="Loading physical topology…" />
          ) : (
            <GraphView ref={graphRef as unknown as Ref<GraphViewHandle>} nodes={nodes} edges={edges} physics={PAGE_PHYSICS} activePage="physical" />
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
