/**
 * @file LayoutView.tsx
 * @description Rack layout canvas view using Konva
 *
 * This component renders a Konva canvas for visualizing physical rack
 * layouts. It displays draggable enclosures containing equipment
 * and freeform device cards placed outside racks.
 *
 * Features:
 * - Pan/zoom navigation with mouse wheel (configurable mode)
 * - Draggable enclosures and freeform devices
 * - Konva Transformer for resize/rotate operations
 * - Theme-aware color palette (dark/light/system)
 * - JSON export of current layout positions
 * - Dot grid background pattern
 * - Icon preloading for all device types
 *
 * Data Structure:
 * - Loaded from JSON passed via `dataPath` prop (default usage: `/data/rack.json`)
 * - Contains enclosures[] (enclosures) and freeform[] (loose devices)
 * - Each rack has items[] with unit positions
 * - Positions and rotations are persisted via exportJSON
 *
 * @example
 * const layoutRef = useRef<LayoutViewHandle>(null);
 *
 * <LayoutView ref={layoutRef} />
 *
 * // Export current layout:
 * layoutRef.current?.exportJSON();
 *
 * @see RackPage.tsx - Parent container component
 * @see nodeType.ts - Canonical node type registry for device icons
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import Konva from 'konva';
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

import { NotificationStack } from '@/components/NotificationStack/NotificationStack';
import { useSettingsValue } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { getNodeTypeOrThrow } from '@/utils/nodeType';

import './LayoutView.css';
import '@/styles/components/page-loading.css';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Imperative methods exposed via ref.
 *
 * @property {function} exportJSON - Copy current layout positions to clipboard
 */
export interface LayoutViewHandle {
  exportJSON: () => void;
}

/**
 * Single device within a rack enclosure.
 *
 * @property {string} id - Unique device identifier
 * @property {string} type - Device type (maps to NODE_TYPES)
 * @property {number} unit - Rack unit position (1-indexed)
 * @property {string} [label] - Display label
 * @property {number} [rotation] - Rotation in degrees
 * @property {number} [scaleX] - Horizontal scale factor
 * @property {number} [scaleY] - Vertical scale factor
 */
interface LayoutItem {
  id: string;
  type: string;
  unit: number;
  label?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

/**
 * Layout enclosure with position and contained items.
 *
 * @property {string} id - Unique rack identifier
 * @property {string} label - Display label
 * @property {number} x - X position on canvas
 * @property {number} y - Y position on canvas
 * @property {number} units - Total rack units (height)
 * @property {number} [rotation] - Rotation in degrees
 * @property {number} [scaleX] - Horizontal scale factor
 * @property {number} [scaleY] - Vertical scale factor
 * @property {LayoutItem[]} items - Devices in this rack
 */
interface LayoutEnclosure {
  id: string;
  label: string;
  x: number;
  y: number;
  units: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  items: LayoutItem[];
}

/**
 * Freeform device placed outside enclosures.
 *
 * @property {string} id - Unique device identifier
 * @property {string} type - Device type (maps to NODE_TYPES)
 * @property {number} x - X position on canvas
 * @property {number} y - Y position on canvas
 * @property {string} [label] - Display label
 * @property {number} [rotation] - Rotation in degrees
 * @property {number} [scaleX] - Horizontal scale factor
 * @property {number} [scaleY] - Vertical scale factor
 */
interface FreeformItem {
  id: string;
  type: string;
  x: number;
  y: number;
  label?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

/**
 * Complete spatial layout data structure.
 *
 * @property {LayoutEnclosure[]} racks - Enclosures
 * @property {FreeformItem[]} freeform - Freeform devices
 */
interface LayoutData {
  enclosures: LayoutEnclosure[];
  freeform: FreeformItem[];
}

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/** Dark theme color palette for rack canvas */
const LAYOUT_DARK = {
  canvasBg: '#0d0e11', cardBg: '#13151a', cardBorder: '#2a2d36',
  cardHover: '#5b6af0', cardSelect: '#7c87ff', enclosureBg: '#1a1c24', enclosureBorder: '#2e3040',
  labelColor: '#c9d1e0', encLabelColor: '#8891a8', trBorder: '#7c87ff', trAnchorFill: '#0d0e11', trAnchorStroke: '#7c87ff',
};

/** Light theme color palette for rack canvas */
const LAYOUT_LIGHT = {
  canvasBg: '#f4f5f8', cardBg: '#ffffff', cardBorder: '#e2e5ed',
  cardHover: '#3b4ce8', cardSelect: '#5b6af0', enclosureBg: '#eef0f6', enclosureBorder: '#d0d4e4',
  labelColor: '#1a1a2e', encLabelColor: '#6b7280', trBorder: '#5b6af0', trAnchorFill: '#ffffff', trAnchorStroke: '#5b6af0',
};

/** Layout constants for rack sizing and spacing */
const LAYOUT_U_HEIGHT = 40;
const LAYOUT_WIDTH = 320;
const LAYOUT_PAD_TOP = 32;
const LAYOUT_ITEM_GAP = 4;
const CARD_IMG_PAD = 4;
const FREEFORM_CARD_W = 140;
const FREEFORM_CARD_H = 52;

/** Base dot grid spacing in pixels (must match CSS --dot-spacing) */
const DOT_SPACING = 24;

/* ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================ */

/**
 * Get SVG icon path for a node type, with theme variant.
 *
 * @param {string} type - Node type identifier
 * @param {boolean} isDark - Whether dark theme is active
 * @returns {string} Icon path
 */
function svgPathForType(type: string, isDark: boolean): string {
  const style = getNodeTypeOrThrow(type);
  return isDark ? style.iconURL.dark : style.iconURL.light;
}

/**
 * Load iconURL asynchronously, returns null on error.
 *
 * @param {string | null} src - Image source URL
 * @returns {Promise<HTMLImageElement | null>} Loaded iconURL or null
 */
async function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    if (!src) { resolve(null); return; }
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Preload all device icons for the spatial layout.
 *
 * @param {LayoutData} data - Rack layout data
 * @param {boolean} isDark - Whether dark theme is active
 * @returns {Promise<Map<string, HTMLImageElement | null>>} Map of item ID to iconURL
 */
async function preloadImages(data: LayoutData, isDark: boolean): Promise<Map<string, HTMLImageElement | null>> {
  const entries: { id: string; type: string }[] = [];
  data.enclosures.forEach(r => r.items.forEach(i => entries.push({ id: i.id, type: i.type })));
  data.freeform.forEach(i => entries.push({ id: i.id, type: i.type }));
  const results = await Promise.all(entries.map(async e => [e.id, await loadImage(svgPathForType(e.type, isDark))] as [string, HTMLImageElement | null]));
  return new Map(results);
}

/**
 * Add hover/click selection behavior to an item group.
 *
 * @param {Konva.Group} group - Item group to make selectable
 * @param {Konva.Rect} card - Card shape for visual feedback
 * @param {Konva.Transformer} tr - Transformer for resize/rotate
 * @param {Konva.Layer} rl - Rack layer
 * @param {Konva.Layer} fl - Freeform layer
 * @param {Konva.Layer} tl - Transform layer
 * @param {typeof LAYOUT_DARK} p - Color palette
 */
function makeSelectable(
  group: Konva.Group, card: Konva.Rect, tr: Konva.Transformer,
  el: Konva.Layer, fl: Konva.Layer, tl: Konva.Layer,
  p: typeof LAYOUT_DARK
) {
  group.on('mouseenter', () => {
    if (tr.nodes().indexOf(group) >= 0) return;
    card.stroke(p.cardHover); el.batchDraw(); fl.batchDraw();
    document.body.style.cursor = 'pointer';
  });
  group.on('mouseleave', () => {
    if (tr.nodes().indexOf(group) >= 0) return;
    card.stroke(p.cardBorder); el.batchDraw(); fl.batchDraw();
    document.body.style.cursor = 'default';
  });
  group.on('click tap', (e) => {
    e.cancelBubble = true;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    tr.nodes().forEach((n: any) => { const c = n.findOne('.item-card') as Konva.Rect | null; if (c) c.stroke(p.cardBorder); });
    tr.nodes([group]); card.stroke(p.cardSelect);
    tl.batchDraw(); el.batchDraw(); fl.batchDraw();
  });
}

/**
 * Sync CSS dot grid background with Konva stage position and scale.
 * Updates background-position and background-size so the grid moves with pan/zoom.
 *
 * @param {HTMLDivElement} container - Container element with dot-grid class
 * @param {Konva.Stage} stage - Konva stage instance
 */
function syncDotGrid(container: HTMLDivElement, stage: Konva.Stage) {
  const scale = stage.scaleX();
  const pos = stage.position();
  const scaledSpacing = DOT_SPACING * scale;
  container.style.backgroundSize = `${scaledSpacing}px ${scaledSpacing}px`;
  container.style.backgroundPosition = `${pos.x % scaledSpacing}px ${pos.y % scaledSpacing}px`;
}

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * LayoutView component - Konva canvas for spatial layout visualization.
 *
 * Features:
 * - Drag-to-reposition racks and devices
 * - Resize/rotate via Konva Transformer
 * - JSON export of current positions
 * - Theme-aware coloring
 *
 * @returns {JSX.Element} Container div with Konva stage
 */
interface LayoutViewProps {
  dataPath: string;
}

const LayoutView = forwardRef<LayoutViewHandle, LayoutViewProps>(({ dataPath }, ref) => {
  /* ===== Refs ===== */

  /** Container element for Konva stage */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Konva stage instance */
  const stageRef = useRef<Konva.Stage | null>(null);

  /** Enclosures layer */
  const enclosureLayerRef = useRef<Konva.Layer | null>(null);

  /** Freeform devices layer */
  const freeformLayerRef = useRef<Konva.Layer | null>(null);

  /** Transform controls layer */
  const transformLayerRef = useRef<Konva.Layer | null>(null);

  /** Transformer instance for resize/rotate */
  const transformerRef = useRef<Konva.Transformer | null>(null);

  /** Map of item ID to Konva group */
  const itemGroupsRef = useRef<Map<string, Konva.Group>>(new Map());

  /** Map of rack ID to Konva group */
  const enclosureGroupsRef = useRef<Map<string, Konva.Group>>(new Map());

  /** Current rack data */
  const layoutDataRef = useRef<LayoutData | null>(null);

  /** Current scroll wheel behavior setting */
  const scrollBehaviorRef = useRef<'zoom' | 'pan'>('zoom');

  /* ===== State & Context ===== */

  const [isLoading, setIsLoading] = useState(true);
  const {
    scrollBehavior,
    fontSize,
    showNodeLabels: isNodeLabelsVisible,
  } = useSettingsValue();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const pal = isDark ? LAYOUT_DARK : LAYOUT_LIGHT;
  const labelSize = Math.max(9, fontSize - 4);

  /* ===== Imperative Handle ===== */

  /**
   * Collect current positions and copy layout JSON to clipboard.
   */
  const handleExportJSON = () => {
    if (!layoutDataRef.current) return;
    const data = layoutDataRef.current;
    const output: LayoutData = { enclosures: [], freeform: [] };

    /* Collect rack positions */
    data.enclosures.forEach(enclosure => {
      const g = enclosureGroupsRef.current.get(enclosure.id);
      const outRack: LayoutEnclosure = {
        id: enclosure.id, label: enclosure.label,
        x: g ? Math.round(g.x()) : enclosure.x,
        y: g ? Math.round(g.y()) : enclosure.y,
        units: enclosure.units,
        rotation: g ? parseFloat(g.rotation().toFixed(2)) : (enclosure.rotation || 0),
        scaleX: g ? parseFloat(g.scaleX().toFixed(3)) : (enclosure.scaleX || 1),
        scaleY: g ? parseFloat(g.scaleY().toFixed(3)) : (enclosure.scaleY || 1),
        items: enclosure.items.map(item => {
          const ig = itemGroupsRef.current.get(item.id);
          return { id: item.id, type: item.type, unit: item.unit, label: item.label, rotation: ig ? parseFloat(ig.rotation().toFixed(2)) : (item.rotation || 0), scaleX: ig ? parseFloat(ig.scaleX().toFixed(3)) : (item.scaleX || 1), scaleY: ig ? parseFloat(ig.scaleY().toFixed(3)) : (item.scaleY || 1) };
        }),
      };
      output.enclosures.push(outRack);
    });

    /* Collect freeform positions */
    data.freeform.forEach(item => {
      const g = itemGroupsRef.current.get(item.id);
      output.freeform.push({ id: item.id, type: item.type, x: g ? Math.round(g.x()) : item.x, y: g ? Math.round(g.y()) : item.y, label: item.label, rotation: g ? parseFloat(g.rotation().toFixed(2)) : (item.rotation || 0), scaleX: g ? parseFloat(g.scaleX().toFixed(3)) : (item.scaleX || 1), scaleY: g ? parseFloat(g.scaleY().toFixed(3)) : (item.scaleY || 1) });
    });

    /* Copy to clipboard */
    const json = JSON.stringify(output, null, 2);
    navigator.clipboard.writeText(json).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = json; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    });
  };

  /**
   * Expose exportJSON method via ref.
   */
  useImperativeHandle(ref, () => ({
    exportJSON: handleExportJSON,
  }));

  /**
   * Build the rack scene from JSON data.
   *
   * @param {LayoutData} data - Rack layout data
 * @param {boolean} isDarkTheme - Whether dark theme is active
 * @param {number} fontSize - Label font size
 * @param {boolean} isNodeLabelsVisible - Whether labels should be visible
 */
function buildScene(data: LayoutData, isDarkTheme: boolean, fontSize: number, isNodeLabelsVisible: boolean) {
    const el = enclosureLayerRef.current; const fl = freeformLayerRef.current; const tl = transformLayerRef.current;
    if (!el || !fl || !tl) return;
    el.destroyChildren(); fl.destroyChildren(); tl.destroyChildren();
    itemGroupsRef.current.clear(); enclosureGroupsRef.current.clear();
    const p = isDarkTheme ? LAYOUT_DARK : LAYOUT_LIGHT;

    /* Create transformer for resize/rotate */
    const tr = new Konva.Transformer({
      enabledAnchors: ['top-left','top-center','top-right','middle-left','middle-right','bottom-left','bottom-center','bottom-right'],
      rotateEnabled: true, borderStroke: p.trBorder, borderStrokeWidth: 2,
      anchorStroke: p.trAnchorStroke, anchorFill: p.trAnchorFill, anchorSize: 9, anchorCornerRadius: 3, keepRatio: false,
    });
    transformerRef.current = tr;
    tl.add(tr);

    /* Preload images then build scene */
    preloadImages(data, isDarkTheme).then(imgs => {
      /* Build enclosures */
      data.enclosures.forEach(enclosure => {
        const encH = LAYOUT_PAD_TOP + enclosure.units * LAYOUT_U_HEIGHT + 8;
        const group = new Konva.Group({ x: enclosure.x || 0, y: enclosure.y || 0, draggable: true, id: `rack-${enclosure.id}`, rotation: enclosure.rotation || 0, scaleX: enclosure.scaleX || 1, scaleY: enclosure.scaleY || 1 });
        group.add(new Konva.Rect({ x: 0, y: 0, width: LAYOUT_WIDTH, height: encH, fill: p.enclosureBg, stroke: p.enclosureBorder, strokeWidth: 1, cornerRadius: 6, name: 'chassis' }));
        group.add(new Konva.Text({ x: 10, y: 8, text: enclosure.label || enclosure.id, fontSize, visible: isNodeLabelsVisible, fontFamily: 'JetBrains Mono, monospace', fontStyle: 'bold', fill: p.encLabelColor, letterSpacing: 1, listening: false, name: 'rack-label' }));
        const innerW = LAYOUT_WIDTH - 16;

        /* Build items within rack */
        (enclosure.items || []).forEach(item => {
          const img = imgs.get(item.id) || null;
          const cardH = item.type.includes('2u') ? LAYOUT_U_HEIGHT * 2 - LAYOUT_ITEM_GAP : LAYOUT_U_HEIGHT - LAYOUT_ITEM_GAP;
          const ig = new Konva.Group({ x: 0, y: 0, draggable: false, id: `item-${item.id}`, rotation: item.rotation || 0, scaleX: item.scaleX || 1, scaleY: item.scaleY || 1 });
          const card = new Konva.Rect({ x: 0, y: 0, width: innerW, height: cardH, fill: p.cardBg, stroke: p.cardBorder, strokeWidth: 1, cornerRadius: 4, name: 'item-card' });
          ig.add(card);
          if (img) ig.add(new Konva.Image({ image: img, x: CARD_IMG_PAD, y: CARD_IMG_PAD, width: innerW - CARD_IMG_PAD * 2, height: cardH - CARD_IMG_PAD * 2, listening: false }));
          ig.add(new Konva.Text({ x: 0, y: cardH + 2, width: innerW, text: item.label || item.id, fontSize, visible: isNodeLabelsVisible, fontFamily: 'JetBrains Mono, monospace', fill: p.labelColor, align: 'center', listening: false, name: 'item-label' }));
          makeSelectable(ig, card, tr, el, fl, tl, p);
          ig.x(8); ig.y(LAYOUT_PAD_TOP + (item.unit - 1) * LAYOUT_U_HEIGHT);
          group.add(ig);
          itemGroupsRef.current.set(item.id, ig);
        });

        group.on('dragstart', () => { document.body.style.cursor = 'grabbing'; });
        group.on('dragend', () => { document.body.style.cursor = 'default'; });
        el.add(group);
        enclosureGroupsRef.current.set(enclosure.id, group);
      });

      /* Build freeform devices */
      data.freeform.forEach(item => {
        const img = imgs.get(item.id) || null;
        let cardW = FREEFORM_CARD_W, cardH = FREEFORM_CARD_H;
        if (img && img.naturalWidth && img.naturalHeight) {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio > 2) { cardW = Math.round(cardH * ratio * 2.2); }
          else if (ratio < 0.8) { cardH = Math.round(cardW / ratio); }
        }
        const g = new Konva.Group({ x: item.x || 0, y: item.y || 0, draggable: true, id: `ff-${item.id}`, rotation: item.rotation || 0, scaleX: item.scaleX || 1, scaleY: item.scaleY || 1 });
        const card = new Konva.Rect({ x: 0, y: 0, width: cardW, height: cardH, fill: p.cardBg, stroke: p.cardBorder, strokeWidth: 1, cornerRadius: 6, name: 'item-card' });
        g.add(card);
        if (img) g.add(new Konva.Image({ image: img, x: CARD_IMG_PAD, y: CARD_IMG_PAD, width: cardW - CARD_IMG_PAD * 2, height: cardH - CARD_IMG_PAD * 2, listening: false }));
        g.add(new Konva.Text({ x: 0, y: cardH + 4, width: cardW, text: item.label || item.id, fontSize, visible: isNodeLabelsVisible, fontFamily: 'JetBrains Mono, monospace', fill: p.labelColor, align: 'center', listening: false, name: 'item-label' }));
        g.on('dragstart', () => { document.body.style.cursor = 'grabbing'; });
        g.on('dragend', () => { document.body.style.cursor = 'default'; });
        makeSelectable(g, card, tr, el, fl, tl, p);
        fl.add(g);
        itemGroupsRef.current.set(item.id, g);
      });

      el.batchDraw(); fl.batchDraw(); tl.batchDraw();
    });
  }

  /* ===== Effect: Initialize Konva Stage ===== */

  /**
   * Initialize Konva stage and layers on mount.
   * Sets up zoom/pan handlers, layers, and loads rack data.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || stageRef.current) return;

    const w = container.offsetWidth || 800;
    const h = container.offsetHeight || 600;
    const stage = new Konva.Stage({ container, width: w, height: h, draggable: true });
    stageRef.current = stage;

    /* Zoom or pan with mouse wheel based on scroll behavior setting */
    const scaleBy = 1.1;
    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const isPinchGesture = e.evt.ctrlKey;
      if (scrollBehaviorRef.current === 'zoom' || isPinchGesture) {
        /* Zoom mode */
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(0.2, Math.min(3, newScale));
        stage.scale({ x: clampedScale, y: clampedScale });
        const newPos = {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        };
        stage.position(newPos);
      } else {
        /* Pan/scroll mode */
        stage.position({
          x: stage.x() - e.evt.deltaX,
          y: stage.y() - e.evt.deltaY,
        });
      }
      stage.batchDraw();
      syncDotGrid(container, stage);
    });

    /* Sync dot grid while dragging the stage */
    stage.on('dragmove', () => {
      syncDotGrid(container, stage);
    });

    /* Initialize dot grid position */
    syncDotGrid(container, stage);

    /* Create layers (dot grid is handled via CSS, not Konva) */
    const el = new Konva.Layer();
    const fl = new Konva.Layer();
    const tl = new Konva.Layer();
    enclosureLayerRef.current = el; freeformLayerRef.current = fl; transformLayerRef.current = tl;
    stage.add(el); stage.add(fl); stage.add(tl);

    /* Handle container resize */
    const ro = new ResizeObserver(() => {
      if (!stageRef.current) return;
      stage.width(container.offsetWidth); stage.height(container.offsetHeight);
    });
    ro.observe(container);

    /* Load rack data */
    fetch(dataPath).then(r => r.json()).then(async (data: LayoutData) => {
      layoutDataRef.current = data;
      buildScene(data, isDark, labelSize, isNodeLabelsVisible);
      setIsLoading(false);
    }).catch(err => {
      console.error('[rack] Failed to load enclosure.json:', err);
      setIsLoading(false);
    });

    return () => {
      ro.disconnect();
      stage.destroy();
      stageRef.current = null;
    };
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  /* ===== Effect: Theme Changes ===== */

  const [, forceUpdate] = useState(0);

  /**
   * Update colors when theme changes.
   * Reloads icons with theme-appropriate variants.
   */
  useEffect(() => {
    if (!stageRef.current || !layoutDataRef.current) return;
    preloadImages(layoutDataRef.current, isDark).then(imgs => {
      itemGroupsRef.current.forEach((group, itemId) => {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const g = group as any;
        const card = g.findOne('.item-card') as Konva.Rect | null;
        const lbl = g.findOne('.item-label') as Konva.Text | null;
        const imgNode = g.findOne('Image') as Konva.Image | null;
        if (card) { card.fill(pal.cardBg); card.stroke(pal.cardBorder); }
        if (lbl) lbl.fill(pal.labelColor);
        if (imgNode) {
          const img = imgs.get(itemId);
          if (img) imgNode.image(img);
        }
      });
      enclosureGroupsRef.current.forEach(group => {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const g = group as any;
        const chassis = g.findOne('.chassis') as Konva.Rect | null;
        const lbl = g.findOne('.rack-label') as Konva.Text | null;
        if (chassis) { chassis.fill(pal.enclosureBg); chassis.stroke(pal.enclosureBorder); }
        if (lbl) lbl.fill(pal.encLabelColor);
      });
      if (transformerRef.current) {
        transformerRef.current.borderStroke(pal.trBorder);
        transformerRef.current.anchorStroke(pal.trAnchorStroke);
        transformerRef.current.anchorFill(pal.trAnchorFill);
      }
      [enclosureLayerRef.current, freeformLayerRef.current, transformLayerRef.current].forEach(l => l?.batchDraw());
      forceUpdate(n => n + 1);
    });
  }, [isDark]); /* eslint-disable-line react-hooks/exhaustive-deps */

  /* ===== Effect: Font Size Changes ===== */

  /**
   * Update label font sizes and visibility when settings change.
   */
  useEffect(() => {
    [enclosureLayerRef.current, freeformLayerRef.current].forEach(layer => {
      if (!layer) return;
      layer.find('Text').forEach(t => {
        (t as Konva.Text).fontSize(labelSize);
        (t as Konva.Text).visible(isNodeLabelsVisible);
      });
      layer.batchDraw();
    });
  }, [labelSize, isNodeLabelsVisible]);

  /* ===== Effect: Scroll Behavior Setting ===== */

  /**
   * Sync scroll behavior ref with app state.
   */
  useEffect(() => {
    scrollBehaviorRef.current = scrollBehavior;
  }, [scrollBehavior]);

  /* ===== Zoom Control Handlers ===== */

  /**
   * Fit all content to viewport.
   * Centers the stage and resets scale to 1.
   */
  const handleFit = () => {
    const stage = stageRef.current;
    const container = containerRef.current;
    if (!stage || !container) return;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
    syncDotGrid(container, stage);
  };

  /**
   * Zoom in by a fixed factor (1.3x).
   */
  const handleZoomIn = () => {
    const stage = stageRef.current;
    const container = containerRef.current;
    if (!stage || !container) return;
    const oldScale = stage.scaleX();
    const newScale = Math.min(3, oldScale * 1.3);
    const center = { x: stage.width() / 2, y: stage.height() / 2 };
    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };
    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    });
    stage.batchDraw();
    syncDotGrid(container, stage);
  };

  /**
   * Zoom out by a fixed factor (0.7x).
   */
  const handleZoomOut = () => {
    const stage = stageRef.current;
    const container = containerRef.current;
    if (!stage || !container) return;
    const oldScale = stage.scaleX();
    const newScale = Math.max(0.2, oldScale * 0.7);
    const center = { x: stage.width() / 2, y: stage.height() / 2 };
    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };
    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    });
    stage.batchDraw();
    syncDotGrid(container, stage);
  };

  /* ===== Render ===== */

  return (
    <>
      {isLoading && (
        <div className="page-loading">
          <div className="page-loading-spinner" />
          <span>Loading rack layout…</span>
        </div>
      )}

      {/* Konva canvas container with CSS dot grid */}
      <div
        ref={containerRef}
        className="canvas-container dot-grid"
        style={{
          backgroundColor: isDark ? '#0d0e11' : '#f4f5f8',
          cursor: 'default',
          visibility: isLoading ? 'hidden' : 'visible',
        }}
      />

      {/* Notification stack for validation warnings */}
      <NotificationStack />

      {/* Zoom controls overlay - sibling to avoid being covered by Konva */}
      {!isLoading && (
        <div className="zoom-controls">
          <button className="zoom-btn" title="Reset view" onClick={handleFit}>
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
          <button className="zoom-btn zoom-btn-text" title="Copy rack layout JSON to clipboard" onClick={handleExportJSON}>
            Export JSON
          </button>
        </div>
      )}
    </>
  );
});

/* Display name for React DevTools */
LayoutView.displayName = 'LayoutView';
export { LayoutView };
