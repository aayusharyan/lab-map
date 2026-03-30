/**
 * @file useFontSize.ts
 * @description Hook for managing app-wide font size with increment/decrement controls
 *
 * This hook provides controls for adjusting the app-wide font size used for
 * UI scaling (labels, buttons, headers, canvas text). Font size is constrained
 * within a range and adjustable in fixed steps for consistent scaling.
 *
 * Hook Type: Derived (wraps useSettings)
 * This hook calls useSettingsOrThrow() internally, which is a context-based hook.
 * It requires the component tree to be wrapped in SettingsProvider.
 *
 * Error Handling:
 * This hook inherits error-throwing behavior from useSettingsOrThrow(). If used
 * outside of SettingsProvider, useSettingsOrThrow() will throw an error. This
 * catches setup mistakes early during development.
 *
 * Font Size Constraints:
 * - Minimum: 11px (readable but compact)
 * - Maximum: 19px (large but not overwhelming)
 * - Step: 2px (provides 5 distinct size options)
 *
 * Available Sizes: 11px, 13px, 15px (default), 17px, 19px
 *
 * The hook also provides flags (`isIncrementAllowed`, `isDecrementAllowed`) to indicate whether
 * further adjustment is possible, useful for disabling UI controls
 * at the limits.
 *
 * @example
 * function FontSizeControls() {
 *   const { fontSize, increment, decrement, isIncrementAllowed, isDecrementAllowed } = useFontSize();
 *
 *   return (
 *     <div>
 *       <button onClick={decrement} disabled={!isDecrementAllowed}>A-</button>
 *       <span>{fontSize}px</span>
 *       <button onClick={increment} disabled={!isIncrementAllowed}>A+</button>
 *     </div>
 *   );
 * }
 *
 * @see SettingsContext.tsx - Font size state management
 * @see useSettings.ts - Base context hook (throws if outside provider)
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { useSettingsOrThrow } from '@/hooks/useSettings';
import { FONT_SIZES, type FontSize } from '@/types/font';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/**
 * Minimum font size in pixels.
 * Smaller sizes become difficult to read.
 */
const FONT_SIZE_MIN = FONT_SIZES[0];

/**
 * Maximum font size in pixels.
 * Larger sizes may cause labels to overlap or overflow.
 */
const FONT_SIZE_MAX = FONT_SIZES[FONT_SIZES.length - 1];

/**
 * Lookup table: font size value → array index.
 * Used for stepping through the FONT_SIZES array.
 */
const FONT_SIZE_INDEX_BY_VALUE: Record<FontSize, number> = {
  11: 0,
  13: 1,
  15: 2,
  17: 3,
  19: 4,
};

/* ============================================================================
 * HOOK IMPLEMENTATION
 * ============================================================================ */

/**
 * Hook for managing app-wide font size.
 *
 * Provides the current font size, functions to increase/decrease it,
 * and flags indicating whether further adjustment is possible.
 *
 * @returns {object} Font size state and controls
 * @returns {number} fontSize - Current font size in pixels
 * @returns {function} increment - Increase font size by one step
 * @returns {function} decrement - Decrease font size by one step
 * @returns {boolean} isIncrementAllowed - Whether font size can be increased
 * @returns {boolean} isDecrementAllowed - Whether font size can be decreased
 *
 * @example
 * const { fontSize, increment, decrement, isIncrementAllowed, isDecrementAllowed } = useFontSize();
 *
 * // Check current size
 * console.log(fontSize); // 15 (default)
 *
 * // Increase if possible
 * if (isIncrementAllowed) increment(); // Now 17
 *
 * // Decrease if possible
 * if (isDecrementAllowed) decrement(); // Back to 15
 */
export function useFontSize() {
  const { state, dispatch } = useSettingsOrThrow();
  const { fontSize } = state.settings;
  const currentIndex = FONT_SIZE_INDEX_BY_VALUE[fontSize];

  /* ==========================================================================
   * INCREMENT/DECREMENT FUNCTIONS
   * ========================================================================== */

  /**
   * Increase font size by one step.
   * No-op if already at maximum.
   */
  function increment() {
    if (currentIndex < FONT_SIZES.length - 1) {
      dispatch({ type: 'SET_FONT_SIZE', size: FONT_SIZES[currentIndex + 1] });
    }
  }

  /**
   * Decrease font size by one step.
   * No-op if already at minimum.
   */
  function decrement() {
    if (currentIndex > 0) {
      dispatch({ type: 'SET_FONT_SIZE', size: FONT_SIZES[currentIndex - 1] });
    }
  }

  /* ==========================================================================
   * RETURN
   * ========================================================================== */

  return {
    /** Current font size in pixels */
    fontSize,

    /** Increase font size by one step (2px) */
    increment,

    /** Decrease font size by one step (2px) */
    decrement,

    /** Whether font size can be increased (not at max) */
    isIncrementAllowed: fontSize < FONT_SIZE_MAX,

    /** Whether font size can be decreased (not at min) */
    isDecrementAllowed: fontSize > FONT_SIZE_MIN,
  };
}
