/**
 * @file Legend.tsx
 * @description Collapsible legend component showing node/edge types
 *
 * This component renders a collapsible legend panel in the sidebar
 * showing the node and edge types available in the current page.
 * Each type is displayed with its themed icon and label.
 *
 * Features:
 * - Collapsible panel with toggle button
 * - Drag-to-resize height
 * - Page-aware type display
 * - Themed image icons for nodes (all nodes are image-based)
 * - Line style indicators for edges
 *
 * Node icons are loaded from public/node-icons/{type}/ with dark.svg
 * or light.svg variants based on the current theme.
 *
 * @example
 * <Legend />
 *
 * @see Sidebar.tsx - Parent component
 * @see config.ts - NODE_STYLES, EDGE_STYLES, PAGES
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useState, useRef, useCallback, useEffect } from 'react';

import { useActivePage } from '@/hooks/useActivePage';
import { useTheme } from '@/hooks/useTheme';
import { PAGES, NODE_STYLES, EDGE_STYLES, TYPE_LABELS } from '@/utils/config';
import { getThemedImagePath } from '@/utils/theme';

import styles from './Legend.module.css';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/** localStorage key for persisting legend state */
const STORAGE_KEY = 'lab-map-legend-state';

/** Height bounds for legend panel (in pixels) */
const MIN_HEIGHT = 60;
const MAX_HEIGHT = 400;

/* ============================================================================
 * TYPES
 * ============================================================================ */

/**
 * Persisted legend state stored in localStorage.
 *
 * @property {boolean} open - Whether the legend panel is expanded
 * @property {number | null} height - Custom height in pixels, or null for default
 */
interface LegendPersistedState {
  open: boolean;
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
    if (!stored) return { open: true, height: null };

    const parsed = JSON.parse(stored) as Partial<LegendPersistedState>;
    const open = typeof parsed.open === 'boolean' ? parsed.open : true;

    /* Validate height is within bounds (browser window may have changed) */
    let height: number | null = null;
    if (typeof parsed.height === 'number' && parsed.height >= MIN_HEIGHT && parsed.height <= MAX_HEIGHT) {
      height = parsed.height;
    }

    return { open, height };
  } catch {
    return { open: true, height: null };
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
 * Render node icon from themed SVG image.
 *
 * All nodes in Lab Map are image-based. Icons are loaded from
 * public/node-icons/{type}/ with dark.svg or light.svg variants.
 *
 * @param {object} props - Component props
 * @param {string} props.image - Path to the themed icon image
 * @returns {JSX.Element} Image element for the node icon
 */
function NodeIcon({ image }: { image: string }) {
  const S = 18;
  return (
    <img
      src={image}
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
 * Displays types available in the current page with themed image
 * icons for nodes and line styles for edges. Panel can be collapsed
 * and resized via drag handle.
 *
 * @returns {JSX.Element | null} Legend element or null if no page config
 */
export function Legend() {
  const activePage = useActivePage();
  const { resolvedTheme } = useTheme();

  /** Load persisted state once on mount */
  const initialState = useRef<LegendPersistedState | null>(null);
  if (initialState.current === null) {
    initialState.current = loadPersistedState();
  }

  /** Open/closed state for collapsible panel */
  const [open, setOpen] = useState(initialState.current.open);

  /** Ref for container element (used for resize) */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Drag state for resize */
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);
  const customHeight = useRef<number | null>(initialState.current.height);

  /** Apply persisted height on mount */
  useEffect(() => {
    if (containerRef.current && customHeight.current !== null && open) {
      containerRef.current.style.maxHeight = customHeight.current + 'px';
    }
  }, []);

  /**
   * Toggle legend panel open/closed.
   * Restores custom height when reopening and persists state.
   */
  const handleToggle = useCallback(() => {
    setOpen(prev => {
      const next = !prev;
      if (containerRef.current) {
        if (next && customHeight.current) {
          containerRef.current.style.maxHeight = customHeight.current + 'px';
        } else if (!next) {
          containerRef.current.style.maxHeight = '';
        }
      }
      /* Persist state to localStorage */
      savePersistedState({ open: next, height: customHeight.current });
      return next;
    });
  }, []);

  /**
   * Handle drag-to-resize legend height.
   * Allows heights between 60px and 400px.
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = containerRef.current.offsetHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    containerRef.current.style.transition = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const delta = startY.current - ev.clientY;
      const newH = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH.current + delta));
      containerRef.current.style.maxHeight = newH + 'px';
      customHeight.current = newH;
    };

    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (containerRef.current) {
        containerRef.current.style.transition = '';
      }
      /* Persist height to localStorage after drag ends */
      savePersistedState({ open: true, height: customHeight.current });
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  /* Get page config */
  const pageConfig = PAGES[activePage];
  if (!pageConfig) return null;

  return (
    <div className={styles.legend}>
      {/* Resize handle (only shown when open) */}
      {open && (
        <div className={styles.resizeHandle} onMouseDown={handleMouseDown}>
          <span className={styles.resizeGrip} />
        </div>
      )}

      {/* Toggle header button */}
      <button className={styles.header} onClick={handleToggle}>
        <span className={styles.title}>Legend</span>
        <span className={`${styles.chevron}${open ? '' : ` ${styles.chevronClosed}`}`}>▾</span>
      </button>

      {/* Collapsible content area */}
      <div
        ref={containerRef}
        className={`${styles.items}${open ? '' : ` ${styles.itemsCollapsed}`}`}
      >
        {/* Node types group - all nodes are image-based */}
        <div className={styles.group}>
          <span className={styles.groupLabel}>Nodes</span>
          {pageConfig.nodeTypes.map(type => {
            const style = NODE_STYLES[type];
            if (!style?.image) return null;
            const image = getThemedImagePath(style.image, resolvedTheme);
            return (
              <div key={type} className={styles.item}>
                <NodeIcon image={image} />
                <span>{TYPE_LABELS.node[type] || type}</span>
              </div>
            );
          })}
        </div>

        {/* Edge types group */}
        <div className={styles.group}>
          <span className={styles.groupLabel}>Connections</span>
          {pageConfig.edgeTypes.map(type => {
            const style = EDGE_STYLES[type];
            if (!style) return null;
            const color = style.color?.color || '#666';
            const isDashed = style.dashes;
            return (
              <div key={type} className={styles.item}>
                <span className={`${styles.line}${isDashed ? ` ${styles.lineDashed}` : ''}`} style={{ background: color, borderColor: color }} />
                <span>{TYPE_LABELS.edge[type] || type}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
