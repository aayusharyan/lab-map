/**
 * @file Sidebar.tsx
 * @description Main sidebar component for node/edge details display
 *
 * This component renders the right sidebar panel that displays details
 * about the currently selected node or edge. The content adapts based
 * on the active page (physical, traffic, vlan).
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
 * - Selection is derived from URL in parent page component
 * - Parent handles data loading and selection; this component handles display
 *
 * @see Legend/index.ts - Legend component
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useRef, useMemo } from 'react';

import type { GraphViewHandle } from '@/components/views/graphView/GraphView';
import { useSettingsValue } from '@/hooks/useSettings';
import { useSidebarResize } from '@/hooks/useSidebarResize';
import { useTheme } from '@/hooks/useTheme';
import type { RawEdge } from '@/utils/edge';
import { getEdgeTypeOrThrow, toVisEdgeColor, type EdgeType } from '@/utils/edgeType';
import { flattenAttributes } from '@/utils/node';
import type { RawNode , NodeAttribute, NodeSubSection, NodeSection } from '@/utils/node';
import { getNodeTypeOrThrow, getNodeThemeColor, type NodeType } from '@/utils/nodeType';
import { navigateToNode } from '@/utils/routing';

import { Legend } from './Legend';
import styles from './Sidebar.module.css';

import type { RefObject } from 'react';


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
      <div className={styles.propKey} style={{ marginBottom: 6 }}>{tableLabel}</div>
      <table className={styles.table}>
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
    <div className={styles.propRow}>
      <span className={styles.propKey}>{label}</span>
      <span className={styles.propVal}>{value}</span>
    </div>
  );
}

/**
 * SbSection - section heading within sidebar content.
 */
function SbSection({ children }: { children: React.ReactNode }) {
  return <h3 className={styles.section}>{children}</h3>;
}

/**
 * SidebarEmpty - empty state when no selection.
 */
function SidebarEmpty() {
  return (
    <div className={styles.empty}>
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
    <div className={styles.nodeIcon}>
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
      <ul className={styles.connList}>
        {neighbours.map(({ node: n, edge: e }, i) => {
          const portHint = (e.from.port && e.to.port) ? `${e.from.port} ↔ ${e.to.port}` : (e.from.port || e.to.port || null);
          const label = e.label ? e.label.replace(/\n/g, ' · ') : null;

          return (
            <li key={i}>
              <span className={styles.connLink} onClick={() => onNodeClick(n.id)}>
                {n.label.split('\n')[0]}
              </span>
              {portHint && <span className={styles.connPort}>{portHint}</span>}
              {label && <span className={styles.connLabel}>{label}</span>}
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
 * - Active page (physical, traffic, vlan)
 * - Selection type (node, edge, or nothing)
 *
 * Includes resize handle, page description, and optional legend.
 */
export function Sidebar({ graphRef, nodes, edges, selectedNode, selectedEdge, pageLabel, nodeTypes, edgeTypes }: Props) {
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
      navigateToNode(nodeId);
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
        <div className={styles.badge}>{style.label}</div>
        <h2 className={styles.title}>{node.label}</h2>
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
        <div className={styles.badge} style={{ background: edgeColor }}>{edgeTypeName}</div>
        <h2 className={styles.title} style={{ fontSize: 13 }}>{fromName} → {toName}</h2>
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

    /* Node selected - show node details and connections */
    return (
      <>
        {renderNodeContent(selectedNode)}
        <ConnectionList
          node={selectedNode}
          allNodes={nodes}
          allEdges={edges}
          onNodeClick={handleNodeClick}
        />
      </>
    );
  }

  return (
    <aside className="app-sidebar" ref={sidebarRef as React.RefObject<HTMLElement>}>
      {/* Drag handle for resizing sidebar width */}
      <div className={styles.resizer} {...resizerProps} />

      {/* Header with page badge and hint */}
      <div className={styles.header}>
        <span className={styles.pageBadge}>{pageLabel}</span>
        <span className={styles.hint}>Click a node</span>
      </div>

      {/* Scrollable content area */}
      <div className={styles.content}>
        {renderContent()}
      </div>

      {/* Optional legend (based on settings) */}
      {isLegendVisible && <Legend nodeItems={nodeItems} edgeItems={edgeItems} />}
    </aside>
  );
}
