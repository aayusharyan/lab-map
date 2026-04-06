/**
 * @file useSidebarResize.ts
 * @description Hook for drag-to-resize sidebar functionality
 *
 * This hook implements drag-to-resize functionality for the sidebar panel.
 * It tracks mouse drag state and updates the sidebar width in real-time
 * as the user drags the resize handle.
 *
 * Hook Type: Pure (refs + DOM events)
 * This hook uses React refs and DOM event listeners. It does NOT require
 * any React Context provider.
 *
 * Error Handling:
 * This hook does NOT throw errors because:
 * - It takes a ref as a parameter (caller's responsibility)
 * - It uses standard DOM APIs (addEventListener, style)
 * - There's no Context provider dependency
 *
 * This differs from context-based hooks (useAppContext, useSettings) which
 * throw errors when used outside their providers.
 *
 * Width Constraints:
 * - Minimum: 220px (enough for content to remain usable)
 * - Maximum: 560px (prevents sidebar from dominating the view)
 *
 * How it works:
 * 1. User clicks on the resize handle (triggers onMouseDown)
 * 2. Hook captures initial mouse position and sidebar width
 * 3. As user drags (mousemove), width is updated in real-time
 * 4. On release (mouseup), event listeners are cleaned up
 *
 * The hook sets cursor style during drag to provide visual feedback
 * and disables text selection to prevent accidental selection.
 *
 * @example
 * function Sidebar() {
 *   const sidebarRef = useRef<HTMLDivElement>(null);
 *   const { resizerProps } = useSidebarResize(sidebarRef);
 *
 *   return (
 *     <aside ref={sidebarRef} className="sidebar">
 *       <div className="resize-handle" {...resizerProps} />
 *       {content}
 *     </aside>
 *   );
 * }
 *
 * @see Sidebar.tsx - Main sidebar component using this hook
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useRef, type RefObject } from 'react';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/**
 * Minimum sidebar width in pixels.
 * Prevents the sidebar from becoming too narrow to be useful.
 */
const MIN = 220;

/**
 * Maximum sidebar width in pixels.
 * Prevents the sidebar from taking up too much screen space.
 */
const MAX = 560;

/**
 * Default sidebar width in pixels.
 */
const DEFAULT = 320;

/* ============================================================================
 * HOOK IMPLEMENTATION
 * ============================================================================ */

/**
 * Hook for drag-to-resize sidebar functionality.
 *
 * Tracks mouse drag state and updates sidebar width in real-time.
 * Returns props to spread on the resize handle element.
 *
 * @param {RefObject<HTMLElement | null>} sidebarRef - Ref to the sidebar element
 * @returns {object} Object containing resizerProps
 * @returns {object} resizerProps - Props to spread on the resize handle element
 *
 * @example
 * const sidebarRef = useRef<HTMLDivElement>(null);
 * const { resizerProps } = useSidebarResize(sidebarRef);
 *
 * return (
 *   <aside ref={sidebarRef}>
 *     <div className="handle" {...resizerProps} />
 *   </aside>
 * );
 */
export function useSidebarResize(sidebarRef: RefObject<HTMLElement | null>) {
  /* ==========================================================================
   * REFS FOR DRAG STATE
   * Using refs instead of state to avoid re-renders during drag
   * ========================================================================== */

  /**
   * Whether a drag operation is currently in progress.
   */
  const isDragging = useRef(false);

  /**
   * Initial mouse X position when drag started.
   */
  const startX = useRef(0);

  /**
   * Initial sidebar width when drag started.
   */
  const startW = useRef(0);

  /* ==========================================================================
   * MOUSE DOWN HANDLER
   * ========================================================================== */

  /**
   * Handle mouse down on the resize handle.
   *
   * Initiates the drag operation by:
   * 1. Recording initial mouse position and sidebar width
   * 2. Setting cursor style for visual feedback
   * 3. Disabling text selection during drag
   * 4. Attaching mousemove and mouseup listeners
   *
   * @param {React.MouseEvent} e - Mouse down event
   */
  function onMouseDown(e: React.MouseEvent) {
    /* Mark drag as in progress */
    isDragging.current = true;

    /* Record initial positions */
    startX.current = e.clientX;
    startW.current = sidebarRef.current?.offsetWidth ?? DEFAULT;

    /* Set cursor style for visual feedback */
    document.body.style.cursor = 'col-resize';

    /* Disable text selection during drag */
    document.body.style.userSelect = 'none';

    /* Prevent default to avoid text selection */
    e.preventDefault();

    /* ========================================================================
     * MOUSE MOVE HANDLER
     * Updates sidebar width as user drags
     * ======================================================================== */

    /**
     * Handle mouse move during drag.
     *
     * Calculates the new width based on how far the mouse has moved
     * from the starting position, clamped to min/max constraints.
     *
     * Note: Delta is calculated as startX - current because the
     * sidebar is on the right side (dragging left increases width).
     *
     * @param {MouseEvent} ev - Mouse move event
     */
    function onMove(ev: MouseEvent) {
      if (!isDragging.current || !sidebarRef.current) return;

      /* Calculate delta (positive = dragging left = wider sidebar) */
      const delta = startX.current - ev.clientX;

      /* Calculate new width, clamped to constraints */
      const newW = Math.min(MAX, Math.max(MIN, startW.current + delta));

      /* Apply new width directly to element style */
      sidebarRef.current.style.width = newW + 'px';
    }

    /* ========================================================================
     * MOUSE UP HANDLER
     * Cleanup when drag ends
     * ======================================================================== */

    /**
     * Handle mouse up (end of drag).
     *
     * Cleans up by:
     * 1. Marking drag as complete
     * 2. Restoring cursor style
     * 3. Re-enabling text selection
     * 4. Removing event listeners
     */
    function onUp() {
      /* Mark drag as complete */
      isDragging.current = false;

      /* Restore cursor and text selection */
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      /* Remove event listeners */
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    /* Attach event listeners to document (not handle) for reliable tracking */
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /* ==========================================================================
   * RETURN
   * ========================================================================== */

  return {
    /**
     * Props to spread on the resize handle element.
     * Currently only includes onMouseDown, but structured as an object
     * for potential future expansion (e.g., touch events).
     */
    resizerProps: { onMouseDown },
  };
}
