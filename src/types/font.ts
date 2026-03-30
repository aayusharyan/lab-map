/**
 * @file font.ts
 * @description Font size type definitions for app-wide UI scaling
 *
 * This file defines the valid font sizes used throughout the application
 * for consistent UI scaling (labels, buttons, headers, canvas text).
 *
 * @see useFontSize.ts - Hook for font size management
 */

/* ============================================================================
 * FONT SIZE
 * ============================================================================ */

/**
 * Valid font size values in pixels.
 * Used for app-wide UI scaling (labels, buttons, headers, canvas text).
 *
 * Available sizes: 11px, 13px, 15px (default), 17px, 19px
 */
export const FONT_SIZES = [11, 13, 15, 17, 19] as const;

/**
 * Font size type (restricted to valid values).
 * Derived from FONT_SIZES constant for type safety.
 */
export type FontSize = (typeof FONT_SIZES)[number];
