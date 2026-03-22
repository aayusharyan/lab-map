/**
 * @file Legend.tsx
 * @description Collapsible legend component showing node/edge types
 *
 * This is a fully modular display component that receives pre-built
 * legend items from the parent (Sidebar). It has no direct dependencies
 * on style configurations - all display data comes via props.
 *
 * Features:
 * - Collapsible panel with toggle button
 * - Drag-to-resize height
 * - Persisted open/height state via localStorage
 * - Image icons for nodes
 * - Line style indicators for edges (solid/dashed)
 *
 * @example
 * const nodeItems = [
 *   {
 *     type: 'desktop-router-1',
 *     label: 'Desktop Router/Firewall - Variant 1',
 *     iconURL: {
 *       dark: '/node-icons/desktop-router-1/dark.svg',
 *       light: '/node-icons/desktop-router-1/light.svg',
 *     },
 *     color: { dark: '#e74c3c', light: '#c62828' },
 *     iconSizeScale: 36,
 *   },
 * ];
 * const edgeItems = [
 *   { type: 'wan', label: 'WAN Uplink', color: { dark: '#38bdf8', light: '#0277bd' }, width: 1.5, dashes: false },
 *   { type: 'trunk', label: 'Trunk (multi-VLAN)', color: { dark: '#e67e22', light: '#d35400' }, width: 1.5, dashes: [6, 3] },
 * ];
 *
 * <Legend nodeItems={nodeItems} edgeItems={edgeItems} />
 *
 * @see Sidebar.tsx - Parent component (builds legend items)
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useState, useRef, useCallback, useEffect } from 'react';

import { useTheme } from '@/hooks/useTheme';
import type { EdgeType } from '@/utils/edgeType';
import type { NodeType } from '@/utils/nodeType';

import styles from './Legend.module.css';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/** localStorage key for persisting legend state. */
const STORAGE_KEY = 'lab-map-legend-state';

/** Height bounds for legend panel (in pixels) */
const MIN_HEIGHT = 60;
const MAX_HEIGHT = 400;

/* ============================================================================
 * TYPES
 * ============================================================================ */

/**
 * Props for Legend component.
 *
 * @property {NodeType[]} nodeItems - Node type display info
 * @property {EdgeType[]} edgeItems - Edge type display info
 */
interface Props {
  nodeItems: NodeType[];
  edgeItems: EdgeType[];
}

/**
 * Persisted legend state stored in localStorage.
 *
 * @property {boolean} isOpen - Whether the legend panel is expanded
 * @property {number | null} height - Custom height in pixels, or null for default
 */
interface LegendPersistedState {
  isOpen: boolean;
  height: number | null;
}

/* ============================================================================
 * HELPERS
 * ============================================================================ */

/**
 * Load legend state from localStorage.
 * Validates height is within bounds, falling back to null if invalid.
 *
 * @returns {LegendPersistedState} Loaded state or defaults
 */
function loadPersistedState(): LegendPersistedState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { isOpen: true, height: null };

    const parsed = JSON.parse(stored) as Partial<LegendPersistedState>;
    const isOpen = typeof parsed.isOpen === 'boolean' ? parsed.isOpen : true;

    /* Validate height is within bounds (browser window may have changed) */
    let height: number | null = null;
    if (typeof parsed.height === 'number' && parsed.height >= MIN_HEIGHT && parsed.height <= MAX_HEIGHT) {
      height = parsed.height;
    }

    return { isOpen, height };
  } catch {
    return { isOpen: true, height: null };
  }
}

/**
 * Save legend state to localStorage.
 *
 * @param {LegendPersistedState} state - State to persist
 */
function savePersistedState(state: LegendPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Ignore storage errors (quota exceeded, etc.) */
  }
}

/* ============================================================================
 * HELPER COMPONENTS
 * ============================================================================ */

/**
 * Render node icon from themed SVG iconURL.
 *
 * All nodes in Lab Map are iconURL-based. Icons are loaded from
 * public/node-icons/{type}/ with dark.svg or light.svg variants.
 *
 * @param {object} props - Component props
 * @param {string} props.iconURL - Path to the themed icon iconURL
 * @returns {JSX.Element} Image element for the node icon
 */
function NodeIcon({ iconURL }: { iconURL: string }) {
  const S = 18;
  return (
    <img
      src={iconURL}
      alt=""
      aria-hidden="true"
      width="28"
      height={S}
      style={{ flexShrink: 0, verticalAlign: 'middle', objectFit: 'contain' }}
    />
  );
}

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Legend component - collapsible panel showing node/edge types.
 *
 * Displays types available in the current page with themed iconURL
 * icons for nodes and line styles for edges. Panel can be collapsed
 * and resized via drag handle.
 *
 * @param {Props} props - Component props
 * @param {NodeType[]} props.nodeItems - Canonical node type items
 * @param {EdgeType[]} props.edgeItems - Canonical edge type items
 * @returns {JSX.Element} Legend element
 */
export function Legend({ nodeItems, edgeItems }: Props) {
  const { resolvedTheme } = useTheme();

  /** Load persisted state once on mount */
  const initialState = useRef<LegendPersistedState | null>(null);
  if (initialState.current === null) {
    initialState.current = loadPersistedState();
  }

  /** Open/closed state for collapsible panel */
  const [isOpen, setIsOpen] = useState(initialState.current.isOpen);

  /** Ref for container element (used for resize) */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Drag state for resize */
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);
  const customHeight = useRef<number | null>(initialState.current.height);

  /** Apply persisted height on mount */
  useEffect(() => {
    if (containerRef.current && customHeight.current !== null && isOpen) {
      containerRef.current.style.maxHeight = customHeight.current + 'px';
    }
  }, []);

  /**
   * Toggle legend panel open/closed.
   * Restores custom height when reopening and persists state.
   */
  const handleToggle = useCallback(() => {
    setIsOpen(prev => {
      const isNextOpen = !prev;
      if (containerRef.current) {
        if (isNextOpen && customHeight.current) {
          containerRef.current.style.maxHeight = customHeight.current + 'px';
        } else if (!isNextOpen) {
          containerRef.current.style.maxHeight = '';
        }
      }
      /* Persist state to localStorage */
      savePersistedState({ isOpen: isNextOpen, height: customHeight.current });
      return isNextOpen;
    });
  }, []);

  /**
   * Handle drag-to-resize legend height.
   * Allows heights between 60px and 400px.
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startH.current = containerRef.current.offsetHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    containerRef.current.style.transition = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const delta = startY.current - ev.clientY;
      const newH = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH.current + delta));
      containerRef.current.style.maxHeight = newH + 'px';
      customHeight.current = newH;
    };

    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (containerRef.current) {
        containerRef.current.style.transition = '';
      }
      /* Persist height to localStorage after drag ends */
      savePersistedState({ isOpen: true, height: customHeight.current });
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div className={styles.legend}>
      {/* Resize handle (only shown when open) */}
      {isOpen && (
        <div className={styles.resizeHandle} onMouseDown={handleMouseDown}>
          <span className={styles.resizeGrip} />
        </div>
      )}

      {/* Toggle header button */}
      <button className={styles.header} onClick={handleToggle}>
        <span className={styles.title}>Legend</span>
        <span className={`${styles.chevron}${isOpen ? '' : ` ${styles.chevronClosed}`}`}>▾</span>
      </button>

      {/* Collapsible content area */}
      <div
        ref={containerRef}
        className={`${styles.items}${isOpen ? '' : ` ${styles.itemsCollapsed}`}`}
      >
        {/* Node types group - all nodes are iconURL-based */}
        <div className={styles.group}>
          <span className={styles.groupLabel}>Nodes</span>
          {nodeItems.map((item, index) => (
            <div key={index} className={styles.item}>
              <NodeIcon iconURL={resolvedTheme === 'dark' ? item.iconURL.dark : item.iconURL.light} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Edge types group */}
        <div className={styles.group}>
          <span className={styles.groupLabel}>Connections</span>
          {edgeItems.map((item, index) => {
            const isDashed = item.dashes !== false;
            const edgeColor = resolvedTheme === 'dark' ? item.color.dark : item.color.light;
            return (
              <div key={index} className={styles.item}>
                <span className={`${styles.line}${isDashed ? ` ${styles.lineDashed}` : ''}`} style={{ background: edgeColor, borderColor: edgeColor }} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
