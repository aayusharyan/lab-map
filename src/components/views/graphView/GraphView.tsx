/**
 * @file GraphView.tsx
 * @description Main network graph visualization component using vis-network
 *
 * This component renders interactive network topology graphs with pan, zoom,
 * and node/edge selection capabilities. It handles VLAN clustering and
 * theme changes.
 *
 * Component Features:
 * - Vis-network integration with custom options
 * - Middle mouse button panning
 * - Scroll wheel behavior mode toggle (zoom or pan)
 * - Click selection with URL deep linking
 * - Double-click cluster expand/collapse for VLAN page
 * - Dynamic theming (dark/light/system mode)
 * - Font size adjustment
 * - Imperative methods exposed via ref (fitGraph, focusNode)
 *
 * Data Flow:
 * - Nodes and edges are passed as props from parent page component
 * - Parent handles data loading and filtering (e.g., traffic flow filtering)
 * - This component focuses on rendering and interaction
 *
 * @example
 * const graphRef = useRef<GraphViewHandle>(null);
 *
 * <GraphView
 *   ref={graphRef}
 *   nodes={data.nodes}
 *   edges={data.edges}
 * />
 *
 * // External control:
 * graphRef.current?.fitGraph();
 * graphRef.current?.focusNode('router1');
 *
 * @see nodeType.ts - Canonical node type style/source-of-truth definitions
 * @see edgeType.ts - Canonical edge style/source-of-truth definitions
 * @see page.ts - Data transformation for vis-network format
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useRef, useEffect, forwardRef, useImperativeHandle, memo } from 'react';
import { Network, DataSet } from 'vis-network/standalone';

import { NotificationStack } from '@/components/NotificationStack/NotificationStack';
import { useRoute } from '@/hooks/useRoute';
import { useSettingsValue } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import type { RawEdge } from '@/utils/edge';
import { getEdgeTypeOrThrow, toVisEdgeColor } from '@/utils/edgeType';
import type { RawNode } from '@/utils/node';
import { getNodeTypeOrThrow, getNodeThemeColor, toVisNodeColor, buildNodeFont } from '@/utils/nodeType';
import { buildPageDataOrThrow } from '@/utils/page';
import type { PageId } from '@/utils/page';
import { navigateToNode, navigateToEdge, clearSelection } from '@/utils/routing';

import type { GraphPhysics } from './GraphView.types';

import './GraphView.css';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Imperative methods exposed via ref for external graph control.
 *
 * @property {function} fitGraph - Animate viewport to fit all nodes in view
 * @property {function} focusNode - Center and zoom to a specific node, then select it
 */
export interface GraphViewHandle {
  /** Animate viewport to fit all nodes in view */
  fitGraph: () => void;
  /** Center and zoom to a specific node, then select it */
  focusNode: (nodeId: string) => void;
}

/**
 * Props for GraphView component.
 *
 * @property {RawNode[]} nodes - Array of nodes to display
 * @property {RawEdge[]} edges - Array of edges to display
 * @property {GraphPhysics} physics - Physics simulation settings for this page
 * @property {PageId} activePage - The page this GraphView belongs to (passed from parent)
 */
export interface GraphViewProps {
  /** Array of nodes to display */
  nodes: RawNode[];
  /** Array of edges to display */
  edges: RawEdge[];
  /** Physics simulation settings */
  physics: GraphPhysics;
  /**
   * The page this GraphView instance belongs to.
   * Passed as a constant from the parent page component so that data transforms
   * always use the correct page type — regardless of URL state during transitions.
   */
  activePage: PageId;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type VisNetwork = any;

/**
 * Search a node's attribute bags (top-level, subSections, and sections) for a key.
 *
 * Searches in order: node.attributes → node.subSections → node.sections (and their subSections).
 * Returns the first matching value, or undefined if the key is absent.
 *
 * @param {RawNode} node - Node to search
 * @param {string} key - Attribute key to look up
 * @returns {string | undefined} First matching attribute value, or undefined
 */
function getNodeAttribute(node: RawNode, key: string): string | undefined {
  if (Array.isArray(node.attributes)) {
    for (const bag of node.attributes) {
      if (bag && typeof bag === 'object' && key in bag) {
        return bag[key];
      }
    }
  }

  if (Array.isArray(node.subSections)) {
    for (const subSection of node.subSections) {
      if (!Array.isArray(subSection.attributes)) continue;
      for (const bag of subSection.attributes) {
        if (bag && typeof bag === 'object' && key in bag) {
          return bag[key];
        }
      }
    }
  }

  if (!Array.isArray(node.sections)) return undefined;
  for (const section of node.sections) {
    if (Array.isArray(section.attributes)) {
      for (const bag of section.attributes) {
        if (bag && typeof bag === 'object' && key in bag) {
          return bag[key];
        }
      }
    }
    if (!Array.isArray(section.subSections)) continue;
    for (const subSection of section.subSections) {
      if (!Array.isArray(subSection.attributes)) continue;
      for (const bag of subSection.attributes) {
        if (bag && typeof bag === 'object' && key in bag) {
          return bag[key];
        }
      }
    }
  }
  return undefined;
}

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/**
 * Vis-network configuration options.
 *
 * Key settings:
 * - Shadows disabled for performance
 * - Smooth edges with continuous curve type (faster than curvedCW)
 * - Zoom limits: 0.3x to 3x
 * - Hover width change disabled to reduce re-renders
 * - Physics enabled for force-directed layout
 */
const GRAPH_OPTIONS = {
  width: '100%',
  height: '100%',
  nodes: {
    borderWidth: 2,
    borderWidthSelected: 3,
    shadow: false, /* Disabled for performance */
  },
  edges: {
    font: { size: 13, color: '#475569', face: 'JetBrains Mono', strokeWidth: 0 },
    smooth: { enabled: true, type: 'continuous', roundness: 0.5 }, /* Faster than curvedCW */
    width: 1,
    hoverWidth: 0, /* Prevent edge width change on hover (reduces re-renders) */
  },
  interaction: {
    hover: true,
    tooltipDelay: 300,
    hideEdgesOnDrag: false,
    hideNodesOnDrag: false,
    navigationButtons: false,
    keyboard: { enabled: false },
    dragView: true,
    zoomView: true,
    multiselect: false,
  },
  layout: { improvedLayout: false },
  physics: { enabled: true },
};

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * GraphView component - main network visualization.
 *
 * Uses forwardRef to expose fitGraph/focusNode methods to parent components.
 * Manages its own vis-network instance and responds to app state changes
 * for theming and font size adjustments.
 *
 * @param {GraphViewProps} props - Component props
 * @param {RawNode[]} props.nodes - Array of nodes to display
 * @param {RawEdge[]} props.edges - Array of edges to display
 * @param {GraphPhysics} props.physics - Physics simulation settings
 * @returns {JSX.Element} Container div with vis-network canvas
 */
const GraphView = forwardRef<GraphViewHandle, GraphViewProps>(({ nodes, edges, physics, activePage }, ref) => {
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

  /** VLAN cluster specifications for expand/collapse */
  const clusterSpecsRef = useRef<{ vn: RawNode; members: Set<string> }[]>([]);

  /** Middle mouse button drag state */
  const mmbRef = useRef<{ startX: number; startY: number; viewX: number; viewY: number; scale: number } | null>(null);

  /** Current scroll wheel behavior setting (used in wheel handler) */
  const scrollBehaviorRef = useRef<'zoom' | 'pan'>('zoom');

  /* ===== State & Context ===== */

  const { subPageId } = useRoute();
  const {
    showNodeLabels: isNodeLabelsVisible,
    showEdgeLabels: isEdgeLabelsVisible,
    fontSize,
    scrollBehavior,
    nodeAnimation: isNodeAnimationEnabled,
  } = useSettingsValue();
  const { resolvedTheme } = useTheme();

  /** Ref to track node-label visibility for use in callbacks */
  const isNodeLabelsVisibleRef = useRef(isNodeLabelsVisible);

  /** Ref to track edge-label visibility for use in callbacks */
  const isEdgeLabelsVisibleRef = useRef(isEdgeLabelsVisible);

  /** Ref to track activePage for use in event callbacks (synced from prop) */
  const activePageRef = useRef(activePage);

  /** Ref to track subPageId for use in event callbacks */
  const subPageIdRef = useRef(subPageId);

  /** Ref to track theme for use in event callbacks */
  const themeRef = useRef(resolvedTheme);

  /* ===== Sync Refs with Current Values ===== */

  useEffect(() => {
    isNodeLabelsVisibleRef.current = isNodeLabelsVisible;
  }, [isNodeLabelsVisible]);

  /**
   * Keep activePage ref in sync with the prop.
   * activePage is a stable constant from the parent page component,
   * so this only runs once on mount in practice.
   */
  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  /**
   * Keep edge-label visibility ref in sync with current value.
   * Must be in useEffect, not during render, to avoid stale closure.
   */
  useEffect(() => {
    isEdgeLabelsVisibleRef.current = isEdgeLabelsVisible;
  }, [isEdgeLabelsVisible]);

  /**
   * Keep subPageId ref in sync for use in event callbacks.
   */
  useEffect(() => {
    subPageIdRef.current = subPageId;
  }, [subPageId]);

  /**
   * Keep theme ref in sync for use in event callbacks.
   */
  useEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  /* ===== Imperative Handle ===== */

  /**
   * Expose methods for external control via ref.
   * Parent components can call graphRef.current.fitGraph() etc.
   */
  useImperativeHandle(ref, () => ({
    fitGraph() {
      networkRef.current?.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' }, minZoomLevel: 0.3, maxZoomLevel: 3 });
    },
    focusNode(nodeId: string) {
      if (!networkRef.current) return;
      networkRef.current.focus(nodeId, { scale: 1.2, animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
      networkRef.current.selectNodes([nodeId]);
    },
  }));

  /* ===== Effect 1: Initialize Network ===== */

  /**
   * Initialize vis-network instance once on mount.
   *
   * Sets up:
   * - Network with container and data sets
   * - Middle mouse button panning
   * - Window resize handler
   * - Font loading completion handler
   * - Zoom limit enforcement
   * - Custom wheel handler for scroll-to-pan mode
   * - Click handler for selection with URL updates
   * - Double-click handler for cluster expand/collapse
   */
  useEffect(() => {
    if (!containerRef.current || networkRef.current) return;

    /* Create vis-network instance */
    const net = new Network(
      containerRef.current,
      { nodes: nodeSetRef.current, edges: edgeSetRef.current },
      GRAPH_OPTIONS
    );
    networkRef.current = net;

    /* Middle mouse button pan handler */
    const container = containerRef.current;
    container.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      const view = net.getViewPosition();
      mmbRef.current = { startX: e.clientX, startY: e.clientY, viewX: view.x, viewY: view.y, scale: net.getScale() };
      container.style.cursor = 'grabbing';
    });
    /* Named references required so document.removeEventListener can target them exactly.
       Inline arrow functions are not removable — they accumulate on the document
       across component mounts and cause growing lag. */
    const handleDocMouseMove = (e: MouseEvent) => {
      if (!mmbRef.current) return;
      const mmb = mmbRef.current;
      const dx = (e.clientX - mmb.startX) / mmb.scale;
      const dy = (e.clientY - mmb.startY) / mmb.scale;
      net.moveTo({ position: { x: mmb.viewX - dx, y: mmb.viewY - dy }, animation: false });
    };
    const handleDocMouseUp = (e: MouseEvent) => {
      if (e.button !== 1 || !mmbRef.current) return;
      mmbRef.current = null;
      container.style.cursor = '';
    };
    document.addEventListener('mousemove', handleDocMouseMove);
    document.addEventListener('mouseup', handleDocMouseUp);

    /* Window resize handler */
    const onResize = () => {
      net.setSize(container.offsetWidth + 'px', container.offsetHeight + 'px');
      net.redraw();
    };
    window.addEventListener('resize', onResize);

    /* Redraw after fonts are loaded to fix label alignment */
    document.fonts.ready.then(() => {
      networkRef.current?.redraw();
    });

    /* Enforce zoom limits (vis-network options don't always work with trackpad) */
    const MIN_ZOOM = 0.3;
    const MAX_ZOOM = 3;
    let lastValidPosition = net.getViewPosition();
    net.on('zoom', () => {
      const scale = net.getScale();
      const position = net.getViewPosition();
      if (scale < MIN_ZOOM) {
        net.moveTo({ scale: MIN_ZOOM, position: lastValidPosition });
      } else if (scale > MAX_ZOOM) {
        net.moveTo({ scale: MAX_ZOOM, position: lastValidPosition });
      } else {
        lastValidPosition = position;
      }
    });

    /* Custom wheel handler for pan mode.
       Keep pinch-to-zoom enabled in all modes (trackpad pinch emits ctrlKey+wheel). */
    const handleWheel = (e: WheelEvent) => {
      const isPinchGesture = e.ctrlKey;
      if (scrollBehaviorRef.current === 'zoom' || isPinchGesture) return; /* Let vis-network handle zoom */
      e.preventDefault();
      e.stopPropagation();
      const position = net.getViewPosition();
      const scale = net.getScale();
      net.moveTo({
        position: {
          x: position.x + e.deltaX / scale,
          y: position.y + e.deltaY / scale,
        },
        animation: false,
      });
    };
    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    /* Click handler for node/edge selection */
    net.on('click', (params: { nodes: string[]; edges: string[] }) => {
      if (params.nodes.length) {
        const nodeId = params.nodes[0];

        /* Handle cluster node click */
        if (net.isCluster(nodeId)) {
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          const clusterOpts = (net as any).body.nodes[nodeId]?.options;
          if (clusterOpts?._raw) {
            navigateToNode(clusterOpts._raw.id);
          }
          return;
        }

        /* Handle regular node click */
        const visNode = nodeSetRef.current.get(nodeId);
        if (visNode?._raw) {
          navigateToNode(visNode._raw.id);
        }
      } else if (params.edges.length) {
        /* Handle edge click */
        const visEdge = edgeSetRef.current.get(params.edges[0]);
        if (visEdge?._raw) {
          navigateToEdge(visEdge._raw.id);
        }
      } else {
        /* Click on empty space - clear selection */
        clearSelection();
      }
    });

    /* Track selection state before drag to restore it after */
    let preDragSelectedNodes: (string | number)[] = [];
    let preDragSelectedEdges: (string | number)[] = [];

    /* Hide tooltip during drag and save current selection */
    net.on('dragStart', () => {
      preDragSelectedNodes = net.getSelectedNodes();
      preDragSelectedEdges = net.getSelectedEdges();
      net.setOptions({ interaction: { tooltipDelay: 999999 } });
    });

    /* Restore pre-drag selection state and tooltip after drag ends.
       If nodes/edges were selected before drag, keep them selected.
       If nothing was selected before drag, clear the auto-selection from dragging. */
    net.on('dragEnd', () => {
      net.selectNodes(preDragSelectedNodes);
      net.selectEdges(preDragSelectedEdges);
      net.setOptions({ interaction: { tooltipDelay: 300 } });
    });

    /* Double-click handler for cluster expand/collapse */
    net.on('doubleClick', (params: { nodes: string[] }) => {
      if (params.nodes.length !== 1) return;
      const nodeId = params.nodes[0];

      if (net.isCluster(nodeId)) {
        /* Expand cluster with circular node placement */
        net.openCluster(nodeId, {
          releaseFunction: (clusterPosition: { x: number; y: number }, containedNodesPositions: Record<string, unknown>) => {
            const ids = Object.keys(containedNodesPositions);
            const positions: Record<string, { x: number; y: number }> = {};
            ids.forEach((id, i) => {
              const angle = (2 * Math.PI * i) / ids.length;
              positions[id] = {
                x: clusterPosition.x + 140 * Math.cos(angle),
                y: clusterPosition.y + 140 * Math.sin(angle),
              };
            });
            return positions;
          },
        });
        return;
      }

      /* Re-cluster node if it belongs to a VLAN */
      const spec = clusterSpecsRef.current.find(s => s.members.has(nodeId));
      if (spec) applyClusterSpecsOrThrow([spec], net, themeRef.current, isNodeLabelsVisibleRef.current);
    });

    /* Cleanup */
    return () => {
      document.removeEventListener('mousemove', handleDocMouseMove);
      document.removeEventListener('mouseup', handleDocMouseUp);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('wheel', handleWheel, true);
      net.destroy();
      networkRef.current = null;
    };
  }, []);

  /* ===== Effect 2: Sync Scroll Behavior Setting ===== */

  /**
   * Keep scroll behavior ref in sync with state.
   * vis-network zoomView stays enabled so pinch-to-zoom works in both modes.
   */
  useEffect(() => {
    scrollBehaviorRef.current = scrollBehavior;
  }, [scrollBehavior]);

  /* ===== Effect 2b: Sync nodeAnimation Setting ===== */

  /**
   * Update physics simulation when nodeAnimation setting changes.
   * When disabled, nodes freeze in place. When enabled, physics resumes.
   */
  useEffect(() => {
    if (!networkRef.current) return;
    networkRef.current.setOptions({ physics: { enabled: isNodeAnimationEnabled } });
  }, [isNodeAnimationEnabled]);

  /* ===== Effect 3: Data Update ===== */

  /**
   * Update graph when nodes/edges props change.
   *
   * Data filtering (e.g., traffic flow) is handled by parent component.
   * This effect transforms the data for vis-network rendering:
   * - Assigns degree-based mass for physics simulation
   * - Sets page-specific physics options
   * - Creates VLAN clusters for vlan page
   */
  useEffect(() => {
    if (!networkRef.current) return;
    if (nodes.length === 0) return;

    /* Track whether this effect run is still active.
       Set to false in cleanup so any pending async callbacks (stabilized,
       fonts.ready, setTimeout) become no-ops if the effect re-runs or the
       component unmounts before they fire. */
    let isActive = true;

    /* Transform data for vis-network */
    const { nodes: styledNodes, edges: styledEdges } = buildPageDataOrThrow(nodes, edges, activePage);

    /* Assign degree-based mass for physics simulation */
    const degrees = new Map(styledNodes.map((n: { id: string }) => [n.id, 0]));
    styledEdges.forEach((e: { from: string; to: string }) => {
      if (degrees.has(e.from)) degrees.set(e.from, (degrees.get(e.from) ?? 0) + 1);
      if (degrees.has(e.to)) degrees.set(e.to, (degrees.get(e.to) ?? 0) + 1);
    });
    /* Place every node on a tiny circle so the physics simulation always produces
       the explode-from-center animation consistently.
       Radius 50 canvas units ≈ 1/10 of the final spread — visually reads as one
       point, but every pair starts with a distinct non-zero distance, which keeps
       ForceAtlas2 numerically stable (no d=0 division issues). */
    const count = styledNodes.length;
    styledNodes.forEach((n: { id: string; mass: number; x: number; y: number }, i: number) => {
      n.mass = Math.min(2, 1 + (degrees.get(n.id) ?? 0) / 10);
      const angle = (2 * Math.PI * i) / count;
      n.x = 50 * Math.cos(angle);
      n.y = 50 * Math.sin(angle);
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
    edgeSetRef.current.add(
      isEdgeLabelsVisibleRef.current ? styledEdges : styledEdges.map((e: { font?: object }) => ({ ...e, font: { ...e.font, size: 0 } }))
    );

    /* Fit view after initial stabilization.
       Named so it can be removed via net.off() in cleanup — prevents multiple
       simultaneous fit animations if Effect 3 re-runs before stabilization. */
    const handleStabilized = () => {
      if (!isActive || !networkRef.current) return;
      networkRef.current.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' }, minZoomLevel: 0.3, maxZoomLevel: 3 });
      /* Redraw after fonts are loaded to fix any label alignment issues */
      document.fonts.ready.then(() => {
        if (!isActive || !networkRef.current) return;
        networkRef.current.redraw();
      });
    };
    net.once('stabilized', handleStabilized);

    /* Create VLAN clusters */
    let vlanTimeoutId: ReturnType<typeof setTimeout> | null = null;
    if (activePage === 'vlan') {
      const vlanNodes = nodes.filter(n => !!getNodeAttribute(n, 'vlanId') && !!getNodeAttribute(n, 'subnet'));
      vlanTimeoutId = setTimeout(() => {
        if (!isActive) return;
        const specs = buildVlanClusterSpecs(vlanNodes, edges);
        clusterSpecsRef.current = specs;
        applyClusterSpecsOrThrow(specs, net, resolvedTheme, isNodeLabelsVisibleRef.current);
      }, 0);
    }

    return () => {
      isActive = false;
      net.off('stabilized', handleStabilized); /* Remove before it fires to prevent double-fit */
      if (vlanTimeoutId !== null) clearTimeout(vlanTimeoutId);
    };
  }, [activePage, nodes, edges, physics]); /* eslint-disable-line react-hooks/exhaustive-deps */

  /* ===== Effect 4: Font Size & Label Visibility ===== */

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

  /* ===== Effect 5: Theme Changes ===== */

  /**
   * Update node and edge colors when theme changes.
   * Also updates VLAN cluster styling and canvas background.
   * Unknown node/edge types throw immediately in strict mode.
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

    /* Re-theme VLAN cluster nodes */
    if (activePage === 'vlan') {
      const vlanStyle = getNodeTypeOrThrow('generic-vpn-1');
      const clusterBaseColor = isDark
        ? getNodeThemeColor(vlanStyle, 'dark')
        : getNodeThemeColor(vlanStyle, 'light');
      const clusterColor = toVisNodeColor(clusterBaseColor);
      nodes
        .filter(n => !!getNodeAttribute(n, 'vlanId') && !!getNodeAttribute(n, 'subnet'))
        .forEach(vn => {
          const clusterId = `cluster_${vn.id}`;
          if (networkRef.current?.isCluster(clusterId)) {
            networkRef.current.clustering.updateClusteredNode(clusterId, {
              color: clusterColor,
              font: buildNodeFont(clusterBaseColor),
            });
          }
        });
    }

    /* Update canvas background */
    const canvas = containerRef.current;
    if (canvas) canvas.style.background = isDark ? '#0f1117' : '#f0f2f7';
  }, [resolvedTheme, activePage, nodes]);

  /* ===== Zoom Control Handlers ===== */

  /**
   * Fit graph to viewport with animation.
   */
  const handleFit = () => {
    networkRef.current?.fit({
      animation: { duration: 500, easingFunction: 'easeInOutQuad' },
      minZoomLevel: 0.3,
      maxZoomLevel: 3,
    });
  };

  /**
   * Zoom in by a fixed factor (1.3x).
   */
  const handleZoomIn = () => {
    if (!networkRef.current) return;
    const scale = networkRef.current.getScale();
    const newScale = Math.min(3, scale * 1.3);
    networkRef.current.moveTo({ scale: newScale, animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
  };

  /**
   * Zoom out by a fixed factor (0.7x).
   */
  const handleZoomOut = () => {
    if (!networkRef.current) return;
    const scale = networkRef.current.getScale();
    const newScale = Math.max(0.3, scale * 0.7);
    networkRef.current.moveTo({ scale: newScale, animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
  };

  /* ===== Render ===== */

  return (
    <>
      {/* Vis-network canvas container */}
      <div ref={containerRef} className="canvas-container" style={{ background: 'var(--bg)' }} />

      {/* Notification stack for validation warnings */}
      <NotificationStack />

      {/* Zoom controls overlay - sibling to avoid being covered by vis-network */}
      <div className="zoom-controls">
        <button className="zoom-btn" title="Fit to screen" onClick={handleFit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
        <button className="zoom-btn" title="Zoom in" onClick={handleZoomIn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </button>
        <button className="zoom-btn" title="Zoom out" onClick={handleZoomOut}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M8 11h6" />
          </svg>
        </button>
      </div>
    </>
  );
});

/* Display name for React DevTools */
GraphView.displayName = 'GraphView';

/* Memoize to prevent unnecessary re-renders */
const MemoizedGraphView = memo(GraphView);
export { MemoizedGraphView as GraphView };

/* ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================ */

/**
 * Build cluster specifications for VLAN grouping.
 *
 * Analyzes edges with type "member" to determine which nodes
 * belong to each VLAN. Returns specifications used by applyClusterSpecsOrThrow.
 *
 * @param vlanNodes - Array of VLAN nodes (type === 'vlan')
 * @param rawEdges - All edges in page
 * @returns Cluster specifications
 */
function buildVlanClusterSpecs(
  vlanNodes: RawNode[],
  rawEdges: { type: string; from: { nodeId: string }; to: { nodeId: string } }[],
) {
  /* Build map of VLAN ID -> member node IDs */
  const memberMap: Record<string, Set<string>> = {};
  vlanNodes.forEach(vn => { memberMap[vn.id] = new Set(); });
  rawEdges.forEach(e => {
    if (e.type === 'member' && memberMap[e.from.nodeId]) memberMap[e.from.nodeId].add(e.to.nodeId);
  });

  /* Return specs for VLANs that have members */
  return vlanNodes
    .filter(vn => (memberMap[vn.id]?.size ?? 0) > 0)
    .map(vn => ({ vn, members: memberMap[vn.id] }));
}

/**
 * Apply VLAN clustering to the network graph.
 *
 * Groups member nodes into cluster nodes displayed as hexagons.
 * Clusters can be expanded/collapsed via double-click.
 *
 * Cluster node properties:
 * - Label shows VLAN ID, name, and member count
 * - Tooltip shows subnet, gateway, DHCP range, etc.
 * - Shape is hexagon with theme-appropriate colors
 *
 * @param {{ vn: RawNode; members: Set<string> }[]} specs - Cluster specifications
 * @param {VisNetwork} net - Vis-network instance
 * @param {'dark' | 'light'} theme - Current resolved theme (falls back to light)
 * @param {boolean} isNodeLabelsVisible - Whether cluster labels should be visible
 */
function applyClusterSpecsOrThrow(
  specs: { vn: RawNode; members: Set<string> }[],
  net: VisNetwork,
  theme: string,
  isNodeLabelsVisible: boolean
) {
  const isDark = theme === 'dark';
  const vlanStyle = getNodeTypeOrThrow('generic-vpn-1');
  const clusterBaseColor = isDark
    ? getNodeThemeColor(vlanStyle, 'dark')
    : getNodeThemeColor(vlanStyle, 'light');
  const clusterColor = toVisNodeColor(clusterBaseColor);

  specs.forEach(({ vn, members }) => {
    const count = members.size;
    const vlanId = getNodeAttribute(vn, 'vlanId') || 'unknown';
    const vlanName = getNodeAttribute(vn, 'name') || vn.label;
    const subnet = getNodeAttribute(vn, 'subnet') || '—';
    const gateway = getNodeAttribute(vn, 'gateway') || '—';
    const dhcpRange = getNodeAttribute(vn, 'dhcpRange') || '—';
    const captivePortal = getNodeAttribute(vn, 'captivePortal');

    /* Build tooltip HTML */
    const el = document.createElement('div');
    el.innerHTML = `<div class="vis-tt">
      <div class="vis-tt-head" style="border-color:#6366f1">VLAN ${vlanId} — ${vlanName}</div>
      <div class="vis-tt-row"><span class="vis-tt-k">Subnet</span><span class="vis-tt-v">${subnet}</span></div>
      <div class="vis-tt-row"><span class="vis-tt-k">Gateway</span><span class="vis-tt-v">${gateway}</span></div>
      <div class="vis-tt-row"><span class="vis-tt-k">DHCP</span><span class="vis-tt-v">${dhcpRange}</span></div>
      <div class="vis-tt-row"><span class="vis-tt-k">Members</span><span class="vis-tt-v">${count} nodes</span></div>
      ${captivePortal === 'true' ? '<div class="vis-tt-note">Captive portal enabled</div>' : ''}
      <div class="vis-tt-note">Double-click to expand</div>
    </div>`;

    /* Create cluster */
    net.cluster({
      joinCondition: (nodeOptions: { id: string }) => members.has(nodeOptions.id),
      clusterNodeProperties: {
        id: `cluster_${vn.id}`,
        label: `VLAN ${vlanId}\n${vlanName}\n[${count} nodes]`,
        title: el,
        shape: 'hexagon',
        color: clusterColor,
        font: { ...buildNodeFont(clusterBaseColor), size: isNodeLabelsVisible ? 15 : 0 },
        size: 40,
        borderWidth: 3,
        _raw: vn,
      },
      clusterEdgeProperties: {},
    });
  });
}
