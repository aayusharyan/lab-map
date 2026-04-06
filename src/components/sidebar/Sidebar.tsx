/**
 * @file Sidebar.tsx
 * @description Main sidebar component for node/edge details display
 *
 * This component renders the right sidebar panel that displays details
 * about the currently selected node or edge. The content adapts based
 * on the active page (physical, traffic, vlan, rack).
 *
 * Component Structure:
 *   Sidebar
 *   ├─ sidebar-resizer (drag handle for width adjustment)
 *   ├─ sidebar-header (page badge + hint text)
 *   ├─ sidebar-content (scrollable area)
 *   │  ├─ Entity header (icon/badge/title for node or edge)
 *   │  ├─ EntityContent (attributes, subSections, sections)
 *   │  └─ ConnectionList (connected nodes)
 *   ├─ sidebar-footer (page description)
 *   └─ Legend (optional, based on settings)
 *
 * Data Flow:
 * - Nodes, edges, and selection are passed as props from parent page component
 * - Selection is derived from URL via useSelection hook in parent
 * - Parent handles data loading and selection; this component handles display
 *
 * @see Legend/index.ts - Legend component
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useRef, useMemo } from 'react';

import type { GraphViewHandle } from '@/components/views/graphView/GraphView';
import { Legend } from './Legend';
import { useActivePage } from '@/hooks/useActivePage';
import { useFlowFromUrl } from '@/hooks/useFlowFromUrl';
import { useSettingsValue } from '@/hooks/useSettings';
import { useSidebarResize } from '@/hooks/useSidebarResize';
import { useTheme } from '@/hooks/useTheme';
import type { RawNode, RawEdge } from '@/types/topology';
import { getNodeTypeOrThrow, type NodeType } from '@/utils/nodeType';
import { getEdgeTypeOrThrow, toVisEdgeColor, type EdgeType } from '@/utils/edgeType';
import { flattenAttributes } from '@/utils/node';
import { navigateTo } from '@/utils/routing';

import '@/styles/components/sidebar.css';

import type { RefObject } from 'react';
import type { NodeAttribute, NodeSubSection, NodeSection } from '@/utils/node';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Props for Sidebar component.
 *
 * @property {RefObject<GraphViewHandle | null>} graphRef - Ref to graph for focus actions
 * @property {RawNode[]} nodes - All nodes in the current page
 * @property {RawEdge[]} edges - All edges in the current page
 * @property {RawNode | null} selectedNode - Currently selected node (derived from URL)
 * @property {RawEdge | null} selectedEdge - Currently selected edge (derived from URL)
 * @property {string} pageLabel - Display label for the current page
 * @property {string} pageDescription - Description text for the current page
 * @property {string[]} nodeTypes - Canonical node type IDs for this page legend
 * @property {string[]} edgeTypes - Valid edge types for this page (for legend)
 */
interface Props {
  graphRef: RefObject<GraphViewHandle | null>;
  nodes: RawNode[];
  edges: RawEdge[];
  selectedNode: RawNode | null;
  selectedEdge: RawEdge | null;
  pageLabel: string;
  pageDescription: string;
  nodeTypes: string[];
  edgeTypes: string[];
}

/* ============================================================================
 * HELPERS
 * ============================================================================ */

/**
 * Render an attribute table with key-value rows.
 *
 * @param {string} tableLabel - Label for the table
 * @param {string} tableKey - Unique key for React rendering
 * @param {Array<{ key: string; value: string }>} rows - Flattened attribute rows
 * @returns {JSX.Element | null} Table element or null if no rows
 */
function renderAttributeTable(
  tableLabel: string,
  tableKey: string,
  rows: Array<{ key: string; value: string }>
): JSX.Element | null {
  if (!rows.length) return null;

  return (
    <div key={tableKey}>
      <div className="prop-key" style={{ marginBottom: 6 }}>{tableLabel}</div>
      <table className="sb-table">
        <thead>
          <tr><th>Attribute</th><th>Value</th></tr>
        </thead>
        <tbody>
          {rows.map(({ key, value }, i) => (
            <tr key={`${tableKey}-prop-${i}`}>
              <td>{key}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================================
 * UI COMPONENTS
 * ============================================================================ */

/**
 * PropRow - key-value row for property display.
 * Returns null for empty, undefined, or "unknown" values.
 */
function PropRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '' || value === 'unknown') return null;

  return (
    <div className="prop-row">
      <span className="prop-key">{label}</span>
      <span className="prop-val">{value}</span>
    </div>
  );
}

/**
 * SbSection - section heading within sidebar content.
 */
function SbSection({ children }: { children: React.ReactNode }) {
  return <h3 className="sb-section">{children}</h3>;
}

/**
 * SidebarEmpty - empty state when no selection.
 */
function SidebarEmpty() {
  return (
    <div className="sidebar-empty">
      <p>Click a node to see details</p>
    </div>
  );
}

/**
 * NodeIcon - display node type icon from config.
 */
function NodeIcon({ type }: { type: string }) {
  const style = getNodeTypeOrThrow(type);
  const { resolvedTheme } = useTheme();

  return (
    <div className="sb-node-icon">
      <img src={resolvedTheme === 'dark' ? style.iconURL.dark : style.iconURL.light} alt={type} />
    </div>
  );
}

/**
 * EntityContent - renders attributes, subSections, and sections.
 * Shared between node and edge display.
 */
function EntityContent({ attributes, subSections, sections }: {
  attributes?: NodeAttribute[];
  subSections?: NodeSubSection[];
  sections?: NodeSection[];
}) {
  const entityAttributes = flattenAttributes(attributes);
  const entitySubSections = Array.isArray(subSections) ? subSections : [];
  const entitySections = Array.isArray(sections) ? sections : [];

  return (
    <>
      {/* Top-level attributes as PropRow items */}
      {entityAttributes.map(({ key, value }, i) => (
        <PropRow key={`entity-attr-${i}`} label={key} value={value} />
      ))}

      {/* Top-level subSections as attribute tables */}
      {entitySubSections.map(subSection =>
        renderAttributeTable(
          subSection.label,
          `entity-subsection-${subSection.key}`,
          flattenAttributes(subSection.attributes),
        )
      )}

      {/* Grouped sections with their attributes and nested subSections */}
      {entitySections.map(section => {
        const sectionRows = flattenAttributes(section.attributes);
        const sectionSubSections = Array.isArray(section.subSections) ? section.subSections : [];
        if (!sectionRows.length && !sectionSubSections.length) return null;

        return (
          <div key={section.key}>
            <SbSection>{section.label}</SbSection>
            {renderAttributeTable('Details', `${section.key}-details`, sectionRows)}
            {sectionSubSections.map(subSection => {
              return renderAttributeTable(
                subSection.label,
                `${section.key}-${subSection.key}`,
                flattenAttributes(subSection.attributes),
              );
            })}
          </div>
        );
      })}
    </>
  );
}

/**
 * ConnectionList - list of connected nodes.
 * Shows all nodes directly connected to the selected node.
 */
function ConnectionList({ node, allNodes, allEdges, onNodeClick }: {
  node: RawNode;
  allNodes: RawNode[];
  allEdges: RawEdge[];
  onNodeClick: (id: string) => void;
}) {
  /* Build node lookup map, including flow node IDs */
  const nodeMap: Record<string, RawNode> = {};
  allNodes.forEach(n => {
    nodeMap[n.id] = n;
    if (n._flowNodeId) nodeMap[n._flowNodeId] = n;
  });

  /* Find all neighbouring nodes via edges */
  const neighbours: { node: RawNode; edge: RawEdge }[] = [];
  allEdges.forEach(e => {
    let otherId: string | null = null;
    if (e.from.nodeId === node.id) otherId = e.to.nodeId;
    else if (e.to.nodeId === node.id) otherId = e.from.nodeId;
    if (otherId && nodeMap[otherId]) {
      neighbours.push({ node: nodeMap[otherId], edge: e });
    }
  });

  if (!neighbours.length) return null;

  return (
    <>
      <SbSection>Connections</SbSection>
      <ul className="conn-list">
        {neighbours.map(({ node: n, edge: e }, i) => {
          const portHint = (e.from.port && e.to.port) ? `${e.from.port} ↔ ${e.to.port}` : (e.from.port || e.to.port || null);
          const label = e.label ? e.label.replace(/\n/g, ' · ') : null;

          return (
            <li key={i}>
              <span className="conn-link" onClick={() => onNodeClick(n.id)}>
                {n.label.split('\n')[0]}
              </span>
              {portHint && <span className="conn-port">{portHint}</span>}
              {label && <span className="conn-label">{label}</span>}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Sidebar component - resizable panel with node/edge details.
 *
 * Renders different content based on:
 * - Active page (physical, traffic, vlan, rack)
 * - Selection type (node, edge, or nothing)
 *
 * Includes resize handle, page description, and optional legend.
 */
export function Sidebar({ graphRef, nodes, edges, selectedNode, selectedEdge, pageLabel, pageDescription, nodeTypes, edgeTypes }: Props) {
  const activePage = useActivePage();
  const { flowId } = useFlowFromUrl();
  const { showLegend: isLegendVisible } = useSettingsValue();

  /** Ref for sidebar element (used by resize hook) */
  const sidebarRef = useRef<HTMLElement>(null);

  /** Get resize drag handler props */
  const { resizerProps } = useSidebarResize(sidebarRef);

  /**
   * Build legend node items from nodeTypes.
   */
  const nodeItems: NodeType[] = useMemo(() => {
    return nodeTypes.map(type => getNodeTypeOrThrow(type));
  }, [nodeTypes]);

  /**
   * Build legend edge items from edgeTypes.
   */
  const edgeItems: EdgeType[] = useMemo(() => {
    return edgeTypes.map(type => getEdgeTypeOrThrow(type));
  }, [edgeTypes]);

  /**
   * Handle connection list click - select node and focus graph.
   */
  function handleNodeClick(nodeId: string) {
    const n = nodes.find(n => n.id === nodeId);
    if (n) {
      navigateTo(activePage, flowId, 'node', nodeId);
      graphRef.current?.focusNode(nodeId);
    }
  }

  /**
   * Render node header and content.
   */
  function renderNodeContent(node: RawNode) {
    const style = getNodeTypeOrThrow(node.type);

    return (
      <>
        <NodeIcon type={node.type} />
        <div className={`sb-badge sb-badge--${node.type}`}>{style.label}</div>
        <h2 className="sb-title">{node.label}</h2>
        <PropRow label="ID" value={node.id} />
        <EntityContent
          attributes={node.attributes}
          subSections={node.subSections}
          sections={node.sections}
        />
      </>
    );
  }

  /**
   * Render edge header and content.
   */
  function renderEdgeContent(edge: RawEdge) {
    /* Build node lookup map for endpoint resolution */
    const nodeMap: Record<string, RawNode> = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    /* Resolve endpoint nodes */
    const fromNode = nodeMap[edge.from.nodeId];
    const toNode = nodeMap[edge.to.nodeId];

    /* Get display names for endpoints (use first line of label) */
    const fromName = fromNode?.label?.split('\n')[0] || edge.from.nodeId;
    const toName = toNode?.label?.split('\n')[0] || edge.to.nodeId;
    const portHint = (edge.from.port && edge.to.port) ? `${edge.from.port} ↔ ${edge.to.port}` : (edge.from.port || edge.to.port);

    /* Get edge type label and color */
    const edgeType = getEdgeTypeOrThrow(edge.type);
    const edgeTypeName = edgeType.label;
    const edgeColor = toVisEdgeColor(edgeType, 'dark').color;

    return (
      <>
        <div className="sb-badge" style={{ background: edgeColor }}>{edgeTypeName}</div>
        <h2 className="sb-title" style={{ fontSize: 13 }}>{fromName} → {toName}</h2>
        {edge.label && <PropRow label="Label" value={edge.label} />}
        {portHint && <PropRow label="Ports" value={portHint} />}
        <EntityContent
          attributes={edge.attributes}
          subSections={edge.subSections}
          sections={edge.sections}
        />
      </>
    );
  }

  /**
   * Render page-specific sidebar content based on selection.
   */
  function renderContent() {
    /* Edge selected - show edge details */
    if (selectedEdge) {
      return renderEdgeContent(selectedEdge);
    }

    /* No selection - show empty state */
    if (!selectedNode) return <SidebarEmpty />;

    /* Node selected - show page-specific content */
    return (
      <>
        {(activePage === 'physical' || activePage === 'traffic' || activePage === 'vlan') && renderNodeContent(selectedNode)}
        {activePage === 'rack' && <SidebarEmpty />}

        {/* Connection list (not shown for rack page) */}
        {activePage !== 'rack' && (
          <ConnectionList
            node={selectedNode}
            allNodes={nodes}
            allEdges={edges}
            onNodeClick={handleNodeClick}
          />
        )}
      </>
    );
  }

  return (
    <aside className="app-sidebar" ref={sidebarRef as React.RefObject<HTMLElement>}>
      {/* Drag handle for resizing sidebar width */}
      <div className="sidebar-resizer" {...resizerProps} />

      {/* Header with page badge and hint */}
      <div className="sidebar-header">
        <span className="sb-page-badge">{pageLabel}</span>
        <span className="sidebar-hint">Click a node</span>
      </div>

      {/* Scrollable content area */}
      <div id="sidebar-content" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', scrollbarWidth: 'thin' }}>
        {renderContent()}
      </div>

      {/* Sidebar footer with page description */}
      <div className="sidebar-footer" style={{ padding: '6px 14px', fontSize: 'calc(11px * var(--ui-scale))', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {pageDescription}
      </div>

      {/* Optional legend (based on settings) */}
      {isLegendVisible && <Legend nodeItems={nodeItems} edgeItems={edgeItems} />}
    </aside>
  );
}
