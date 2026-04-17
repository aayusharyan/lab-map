/**
 * @file TrafficPage.tsx
 * @description Traffic page view container component with flow filtering
 *
 * This component renders the traffic flow page view. It shows data
 * traffic flows between network nodes and includes a FlowBar for
 * filtering the view by specific traffic flows.
 *
 * The traffic page visualizes how data moves through the network,
 * with different flows representing different types of traffic
 * (e.g., internet traffic, backup flows, replication).
 *
 * Component Structure:
 *   TrafficPage
 *   ├─ app-body (container)
 *   │  ├─ FlowBar (flow filter buttons)
 *   │  └─ app-content (flex layout)
 *   │     ├─ graph-area (main content)
 *   │     │  ├─ GraphView (network graph)
 *   │     │  └─ app-footer (footer with page description + GitHub link)
 *   │     └─ Sidebar (right panel)
 *
 * Data Flow:
 * - Loads traffic.json data on mount via local state
 * - Flow filter state (activeFlow) derived from URL via useRoute
 * - Filtering logic applied before passing data to GraphView
 *
 * @example
 * const graphRef = useRef<GraphViewHandle>(null);
 *
 * <TrafficPage graphRef={graphRef} />
 *
 * @see GraphView.tsx - Network graph component
 * @see FlowBar.tsx - Flow filter button bar
 * @see Sidebar.tsx - Side panel with node details
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { type RefObject, type Ref, useEffect, useMemo, useState, useCallback } from 'react';

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
 * Inline config for traffic page (physics, labels, types)
 * ============================================================================ */

/** Page label for sidebar badge */
const PAGE_LABEL = "Traffic / Services";

/** Page description for footer and sidebar */
const PAGE_DESCRIPTION = "Select a service flow above to see its request path. Click nodes for service config and env vars.";

/** vis-network physics configuration */
const PAGE_PHYSICS: GraphPhysics = {
  enabled: true,
  solver: "forceAtlas2Based",
  forceAtlas2Based: { gravitationalConstant: -130, centralGravity: 0.012, springLength: 160, springConstant: 0.06, damping: 0.9 },
  stabilization: { iterations: 300, updateInterval: 25 },
};

/** Valid node types for this page (determines legend items) */
const PAGE_NODE_TYPES = ["generic-internet-1", "generic-vpn-1", "desktop-router-1", "desktop-compute-1", "server-rack-1u-router-1", "server-rack-1u-compute-1", "server-rack-2u-compute-1"];

/** Valid edge types for this page (determines legend items) */
const PAGE_EDGE_TYPES = ["wan", "cdn", "proxy", "hosts", "forward", "dependency", "internal"];

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Props for TrafficPage component.
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
 * TrafficPage component - traffic flow visualization view.
 *
 * Renders the traffic page with:
 * - FlowBar for filtering by traffic flow
 * - GraphView for network visualization
 * - Footer with page description and GitHub link
 * - Sidebar for node details and filters
 *
 * Flow State:
 * - activeFlow is managed locally (not in AppContext)
 * - When a flow is selected, nodes/edges are filtered before passing to GraphView
 *
 * Loads traffic.json data on mount (fresh load every time for animations).
 *
 * @param {Props} props - Component props
 * @returns {JSX.Element} Traffic page view element
 */
export function TrafficPage({ graphRef }: Props) {
  /* ===== Route State ===== */
  const { subPageId: activeFlow, selectionType, selectionId } = useRoute();

  /* ===== Local State ===== */
  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load traffic page data.
   * Wrapped in useCallback to maintain stable reference.
   */
  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pageData = await loadPageDataOrThrow('traffic');
      setData(pageData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load traffic page data on mount.
   * Always loads fresh to trigger animations.
   */
  useEffect(() => {
    loadPage();
  }, [loadPage]);

  /* Log error to console (UI shows loading spinner on error for now) */
  if (error) {
    console.error('TrafficPage load error:', error);
  }

  /**
   * Filter nodes and edges based on active flow.
   * If no flow is selected (null), show all data.
   * Otherwise, filter to only nodes/edges participating in the selected flow.
   */
  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    if (activeFlow === null) {
      return { nodes: data.nodes, edges: data.edges };
    }

    /* Filter nodes that participate in the active flow */
    const filteredNodes = data.nodes.filter(
      n => Array.isArray(n.flows) && n.flows.includes(activeFlow)
    );

    /* Build set of valid node IDs for edge filtering */
    const nodeIds = new Set(filteredNodes.map(n => n.id));

    /* Filter edges that participate in the active flow and connect valid nodes */
    const filteredEdges = data.edges.filter(
      e => Array.isArray(e.flows) && e.flows.includes(activeFlow) &&
           nodeIds.has(e.from.nodeId) && nodeIds.has(e.to.nodeId)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [data, activeFlow]);

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
      {/* Flow filter bar is now rendered by AppSubHeader in App.tsx */}

      <div className="app-content">
        {/* Main graph area */}
        <main className="canvas-area">
          {isLoading ? (
            <PageLoading message="Loading traffic flows…" />
          ) : (
            <GraphView ref={graphRef as unknown as Ref<GraphViewHandle>} nodes={nodes} edges={edges} physics={PAGE_PHYSICS} activePage="traffic" />
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
