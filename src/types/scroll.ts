/**
 * @file scroll.ts
 * @description Scroll behavior type definitions for canvas interactions
 *
 * This file defines the scroll wheel behavior modes used for graph
 * and layout canvases throughout the application.
 *
 * @see SettingsContext.types.ts - AppSettings interface using this type
 */

/* ============================================================================
 * SCROLL BEHAVIOR
 * ============================================================================ */

/**
 * Scroll wheel behavior mode for graph and layout canvases.
 *
 * @value 'zoom' - Scroll wheel zooms in/out
 * @value 'pan' - Scroll wheel pans vertically
 */
export type ScrollBehavior = 'zoom' | 'pan';
