/**
 * @file useVisNetwork.ts
 * @description Reusable hook for initializing and managing vis-network instances
 *
 * This hook provides a reusable foundation for creating vis-network graph
 * instances. It handles network initialization, pan/zoom controls, click
 * handlers, theming, and font sizing.
 *
 * Used by graph-rendering paths to avoid duplicating vis-network setup logic.
 *
 * Features:
 * - Network initialization with shared configuration
 * - Middle mouse button panning
 * - Click selection via URL navigation (selection derived via useSelection hook)
 * - Theme-aware node/edge coloring
 * - Font size synchronization
 * - Degree-based node mass for physics
 * - Imperative methods (fitGraph, focusNode)
 *
 * @example
 * const { containerRef, fitGraph, focusNode } = useVisNetwork({
 *   pageId: 'physical',
 *   nodes: cachedNodes,
 *   edges: cachedEdges,
 * });
 *
 * // Attach to container
 * <div ref={containerRef} />
 *
 * // Control the graph
 * fitGraph();
 * focusNode('router1');
 *
 * @see GraphView.tsx - Main graph component
 * @see nodeType.ts - Canonical node type style/source-of-truth definitions
 * @see edgeType.ts - Canonical edge style/source-of-truth definitions
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useRef, useEffect, useCallback } from 'react';
import { Network, DataSet } from 'vis-network/standalone';

import { useFlowFromUrl } from '@/hooks/useFlowFromUrl';
import { useSettingsValue } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import type { PageId } from '@/utils/page';
import type { GraphPhysics } from './GraphView.types';
import type { RawNode, RawEdge } from '@/types/topology';
import { getNodeTypeOrThrow, getNodeThemeColor, toVisNodeColor } from '@/utils/nodeType';
import { getEdgeTypeOrThrow, toVisEdgeColor } from '@/utils/edgeType';
import { buildPageData } from '@/utils/page';
import { navigateTo } from '@/utils/routing';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Imperative methods for external graph control.
 *
 * @property {function} fitGraph - Animate viewport to fit all nodes
 * @property {function} focusNode - Center and zoom to a specific node
 */
export interface GraphViewHandle {
  fitGraph: () => void;
  focusNode: (nodeId: string) => void;
}

/**
 * Options passed to useVisNetwork hook.
 *
 * @property {PageId} pageId - Which page this graph is for
 * @property {RawNode[]} nodes - Node data to display
 * @property {RawEdge[]} edges - Edge data to display
 * @property {GraphPhysics} physics - Physics simulation settings
 * @property {function} [onDoubleClick] - Optional double-click handler
 */
export interface UseVisNetworkOptions {
  pageId: PageId;
  nodes: RawNode[];
  edges: RawEdge[];
  physics: GraphPhysics;
  onDoubleClick?: (params: { nodes: string[] }) => void;
}

/**
 * Return value from useVisNetwork hook.
 *
 * @property {RefObject} containerRef - Ref to attach to container div
 * @property {MutableRefObject} networkRef - Ref to vis-network instance
 * @property {MutableRefObject} nodeSetRef - Ref to node DataSet
 * @property {MutableRefObject} edgeSetRef - Ref to edge DataSet
 * @property {function} fitGraph - Fit all nodes in viewport
 * @property {function} focusNode - Focus on specific node
 */
export interface UseVisNetworkResult {
  /** Ref to attach to container div */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Ref to vis-network instance for direct API access */
  networkRef: React.MutableRefObject<VisNetwork | null>;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  nodeSetRef: React.MutableRefObject<any>;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  edgeSetRef: React.MutableRefObject<any>;
  fitGraph: () => void;
  focusNode: (nodeId: string) => void;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type VisNetwork = any;

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/**
 * Default vis-network options.
 *
 * Configures:
 * - Node shadows (enabled with blur effect)
 * - Edge smoothing with curved lines
 * - Zoom limits: 0.2x to 4x
 * - Hover interaction enabled
 * - Physics simulation enabled
 */
const GRAPH_OPTIONS = {
  width: '100%',
  height: '100%',
  nodes: {
    borderWidth: 2,
    borderWidthSelected: 3,
    shadow: { enabled: true, size: 10, x: 0, y: 0, color: 'rgba(0,0,0,0.5)' },
  },
  edges: {
    font: { size: 13, color: '#475569', face: 'JetBrains Mono', strokeWidth: 0 },
    smooth: { enabled: true, type: 'curvedCW', roundness: 0.15 },
    width: 1,
    hoverWidth: 0, /* Prevent edge width change on hover (reduces re-renders) */
  },
  interaction: {
    hover: true,
    tooltipDelay: 300,
    hideEdgesOnDrag: false,
    navigationButtons: false,
    keyboard: { enabled: false },
    dragView: true,
    zoomView: true,
    zoomSpeed: 1,
    minZoom: 0.2,
    maxZoom: 4,
    multiselect: false,
  },
  layout: { improvedLayout: false },
  physics: { enabled: true },
};

/* ============================================================================
 * HOOK
 * ============================================================================ */

/**
 * Initialize a vis-network graph with standard configuration.
 *
 * This hook manages the full lifecycle of a vis-network instance:
 * 1. Creates network on mount with container and data sets
 * 2. Sets up middle-mouse pan and click handlers
 * 3. Loads and transforms page data
 * 4. Updates styling on font size or theme changes (falls back to light)
 * 5. Destroys network on unmount
 *
 * @param {UseVisNetworkOptions} options - Configuration options
 * @returns {UseVisNetworkResult} Refs and control methods
 */
export function useVisNetwork({
  pageId,
  nodes,
  edges,
  physics,
  onDoubleClick,
}: UseVisNetworkOptions): UseVisNetworkResult {

  /* ===== Refs ===== */

  /** Container element for vis-network canvas */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Vis-network instance */
  const networkRef = useRef<VisNetwork>(null);

  /** DataSet for nodes - allows incremental updates */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const nodeSetRef = useRef<any>(new DataSet());

  /** DataSet for edges - allows incremental updates */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const edgeSetRef = useRef<any>(new DataSet());

  /** Middle mouse button drag state */
  const mmbRef = useRef<{ startX: number; startY: number; viewX: number; viewY: number; scale: number } | null>(null);

  /* ===== Context & State ===== */

  const {
    showNodeLabels: isNodeLabelsVisible,
    showEdgeLabels: isEdgeLabelsVisible,
    fontSize,
  } = useSettingsValue();
  const { resolvedTheme } = useTheme();
  const { flowId } = useFlowFromUrl();

  /** Ref to track node-label visibility for use in callbacks */
  const isNodeLabelsVisibleRef = useRef(isNodeLabelsVisible);

  /** Ref to track edge-label visibility for use in callbacks */
  const isEdgeLabelsVisibleRef = useRef(isEdgeLabelsVisible);

  useEffect(() => {
    isNodeLabelsVisibleRef.current = isNodeLabelsVisible;
  }, [isNodeLabelsVisible]);

  /* ===== Stable Callbacks ===== */

  /**
   * Animate viewport to fit all nodes in view.
   * Uses smooth easing animation over 500ms.
   */
  const fitGraph = useCallback(() => {
    networkRef.current?.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
  }, []);

  /**
   * Center and zoom to a specific node, then select it.
   * Zooms to 1.2x scale with smooth animation.
   *
   * @param {string} nodeId - ID of node to focus
   */
  const focusNode = useCallback((nodeId: string) => {
    if (!networkRef.current) return;
    networkRef.current.focus(nodeId, { scale: 1.2, animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    networkRef.current.selectNodes([nodeId]);
  }, []);

  /* ===== Effect 1: Initialize Network ===== */

  /**
   * Initialize vis-network instance once on mount.
   *
   * Sets up:
   * - Network with container and empty data sets
   * - Middle mouse button panning
   * - Window resize handler
   * - Font loading completion handler
   * - Click handler for selection
   * - Optional double-click handler
   */
  useEffect(() => {
    if (!containerRef.current || networkRef.current) return;

    const container = containerRef.current;

    /* Create vis-network instance */
    const net = new Network(
      container,
      { nodes: nodeSetRef.current, edges: edgeSetRef.current },
      GRAPH_OPTIONS
    );
    networkRef.current = net;

    /* Middle mouse button pan handler */
    container.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      const view = net.getViewPosition();
      mmbRef.current = { startX: e.clientX, startY: e.clientY, viewX: view.x, viewY: view.y, scale: net.getScale() };
      container.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!mmbRef.current) return;
      const mmb = mmbRef.current;
      const dx = (e.clientX - mmb.startX) / mmb.scale;
      const dy = (e.clientY - mmb.startY) / mmb.scale;
      net.moveTo({ position: { x: mmb.viewX - dx, y: mmb.viewY - dy }, animation: false });
    });
    document.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button !== 1 || !mmbRef.current) return;
      mmbRef.current = null;
      container.style.cursor = '';
    });

    /* Window resize handler */
    const onResize = () => {
      net.setSize(container.offsetWidth + 'px', container.offsetHeight + 'px');
      net.redraw();
    };
    window.addEventListener('resize', onResize);

    /* Redraw after fonts loaded */
    document.fonts.ready.then(() => {
      net.redraw();
    });

    /* Click handler for node/edge selection (updates URL, selection derived via useSelection) */
    net.on('click', (params: { nodes: string[]; edges: string[] }) => {
      if (params.nodes.length) {
        const nodeId = params.nodes[0];

        /* Handle cluster node click */
        if (net.isCluster(nodeId)) {
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          const clusterOpts = (net as any).body.nodes[nodeId]?.options;
          if (clusterOpts?._raw) {
            navigateTo(pageId, flowId, 'node', clusterOpts._raw.id);
          }
          return;
        }

        /* Handle regular node click */
        const visNode = nodeSetRef.current.get(nodeId);
        if (visNode?._raw) navigateTo(pageId, flowId, 'node', visNode._raw.id);
      } else if (params.edges.length) {
        /* Handle edge click */
        const visEdge = edgeSetRef.current.get(params.edges[0]);
        if (visEdge?._raw) navigateTo(pageId, flowId, 'edge', visEdge._raw.id);
      } else {
        /* Click on empty space - clear selection */
        navigateTo(pageId, flowId, null, null);
      }
    });

    /* Optional double-click handler (passed in by page component) */
    if (onDoubleClick) {
      net.on('doubleClick', onDoubleClick);
    }

    /* Cleanup */
    return () => {
      window.removeEventListener('resize', onResize);
      net.destroy();
      networkRef.current = null;
    };
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  /* ===== Effect 2: Load Page Data ===== */

  /**
   * Load and transform page data when nodes/edges change.
   *
   * Transforms raw data to vis-network format with:
   * - Page-specific styling
   * - Degree-based mass for physics simulation
   * - Edge label visibility based on settings
   */
  useEffect(() => {
    if (!networkRef.current || nodes.length === 0) return;

    /* Transform data for vis-network */
    const { nodes: styledNodes, edges: styledEdges } = buildPageData(nodes, edges, pageId);

    /* Assign degree-based mass for physics simulation */
    const degrees = new Map(styledNodes.map((n: { id: string }) => [n.id, 0]));
    styledEdges.forEach((e: { from: string; to: string }) => {
      if (degrees.has(e.from)) degrees.set(e.from, (degrees.get(e.from) ?? 0) + 1);
      if (degrees.has(e.to)) degrees.set(e.to, (degrees.get(e.to) ?? 0) + 1);
    });
    styledNodes.forEach((n: { id: string; mass: number }) => {
      n.mass = Math.min(2, 1 + (degrees.get(n.id) ?? 0) / 10);
    });

    /* Update vis-network */
    const net = networkRef.current;
    net.setOptions({ physics, layout: { hierarchical: { enabled: false } } });
    nodeSetRef.current.clear();
    edgeSetRef.current.clear();
    nodeSetRef.current.add(
      isNodeLabelsVisibleRef.current
        ? styledNodes
        : styledNodes.map((n: { font?: object }) => ({ ...n, font: { ...n.font, size: 0 } }))
    );

    /* Apply edge label visibility */
    const edgeFontSize = isEdgeLabelsVisibleRef.current ? undefined : 0;
    edgeSetRef.current.add(
      edgeFontSize === undefined ? styledEdges : styledEdges.map((e: { font?: object }) => ({ ...e, font: { ...e.font, size: 0 } }))
    );

    /* Fit view after stabilization */
    net.once('stabilizationIterationsDone', () => {
      net.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
      /* Redraw after fonts are loaded to fix any label alignment issues */
      document.fonts.ready.then(() => {
        net.redraw();
      });
    });
    net.stabilize(200);
  }, [pageId, nodes, edges, physics]);

  /* ===== Effect 3: Font Size & Edge Label Visibility ===== */

  /**
   * Update font sizes when fontSize, node-label visibility, or edge-label visibility changes.
   * Also sets CSS custom property for UI scaling.
   */
  useEffect(() => {
    if (!networkRef.current) return;

    /* Update node font sizes */
    const currentFontSize = isNodeLabelsVisible ? fontSize : 0;
    const nodeUpdates: unknown[] = [];
    nodeSetRef.current.forEach((n: { id: string; font: object }) => {
      nodeUpdates.push({ id: n.id, font: { ...n.font, size: currentFontSize } });
    });
    nodeSetRef.current.update(nodeUpdates);

    /* Update edge font sizes (0 to hide labels) */
    const edgeFontSize = isEdgeLabelsVisible ? fontSize - 2 : 0;
    const edgeUpdates: unknown[] = [];
    edgeSetRef.current.forEach((e: { id: string; font: object }) => {
      edgeUpdates.push({ id: e.id, font: { ...e.font, size: edgeFontSize } });
    });
    edgeSetRef.current.update(edgeUpdates);

    /* Set CSS custom property for UI scaling */
    document.documentElement.style.setProperty('--ui-scale', String(fontSize / 15));
  }, [fontSize, isNodeLabelsVisible, isEdgeLabelsVisible]);

  /* ===== Effect 4: Theme Changes ===== */

   /**
    * Update node and edge colors when theme changes.
    * Handles dark mode switching with strict node/edge type resolution:
    * - Node background colors
    * - Node font colors
    * - Node icons (dark.svg vs light.svg)
    * - Edge colors
    * - Canvas background
    */
  useEffect(() => {
    if (!networkRef.current) return;
    const isDark = resolvedTheme === 'dark';

    /* Update node colors and icons */
    const nodeUpdates: unknown[] = [];
    nodeSetRef.current.forEach((node: { id: string; font: object; _raw?: { type: string } }) => {
      const type = node._raw?.type || '';
      if (isDark) {
        const style = getNodeTypeOrThrow(type);
        const accentColor = getNodeThemeColor(style, 'dark');
        const update: Record<string, unknown> = {
          id: node.id,
          color: toVisNodeColor(accentColor),
          font: { ...node.font, color: accentColor },
        };
        if (style.iconURL) update.image = style.iconURL.dark;
        nodeUpdates.push(update);
      } else {
        const style = getNodeTypeOrThrow(type);
        const accentColor = getNodeThemeColor(style, 'light');
        const update: Record<string, unknown> = {
          id: node.id,
          color: toVisNodeColor(accentColor),
          font: { ...node.font, color: accentColor },
        };
        if (style.iconURL) {
          update.image = style.iconURL.light;
        }
        nodeUpdates.push(update);
      }
    });
    nodeSetRef.current.update(nodeUpdates);

    /* Update edge colors */
    const edgeUpdates: unknown[] = [];
    edgeSetRef.current.forEach((edge: { id: string; _raw?: { type: string } }) => {
      const type = edge._raw?.type || '';
      const edgeType = getEdgeTypeOrThrow(type);
      const colorSet = toVisEdgeColor(edgeType, isDark ? 'dark' : 'light');
      edgeUpdates.push({ id: edge.id, color: colorSet });
    });
    edgeSetRef.current.update(edgeUpdates);

    /* Update canvas background */
    const canvas = containerRef.current;
    if (canvas) canvas.style.background = isDark ? '#0f1117' : '#f0f2f7';
  }, [resolvedTheme, nodes.length, edges.length]);

  /* ===== Return ===== */

  return {
    containerRef,
    networkRef,
    nodeSetRef,
    edgeSetRef,
    fitGraph,
    focusNode,
  };
}
