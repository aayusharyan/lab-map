/**
 * @file Tabs.types.ts
 * @description Type definitions for the generic Tabs component
 *
 * Defines the props interface and tab item structure used by the Tabs
 * component. Supports multiple visual variants for different contexts
 * (header navigation vs subheader filters).
 */

/* ============================================================================
 * TAB ITEM
 * ============================================================================ */

/**
 * Individual tab item definition.
 *
 * @property id - Unique identifier for the tab
 * @property label - Display text shown on the tab
 * @property title - Optional tooltip text (defaults to label if not provided)
 */
export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  title?: string;
}

/* ============================================================================
 * COMPONENT PROPS
 * ============================================================================ */

/**
 * Visual style variants for the Tabs component.
 *
 * - `header`: Rectangular tabs with solid active background (used in AppHeader)
 * - `pill`: Rounded pill shape with accent-tinted active state (used in AppSubHeader)
 */
export type TabsVariant = 'header' | 'pill';

/**
 * Props for the Tabs component.
 *
 * @template T - Type of tab IDs (defaults to string)
 *
 * @property items - Array of tab items to render
 * @property activeId - ID of the currently active tab (null for none selected)
 * @property onSelect - Callback when a tab is clicked
 * @property variant - Visual style variant (defaults to 'header')
 * @property allOption - Optional "all" option shown first (for pill variant)
 * @property className - Additional CSS class for the container
 */
export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeId: T | null;
  onSelect: (id: T | null) => void;
  variant?: TabsVariant;
  allOption?: {
    label: string;
    title?: string;
  };
  className?: string;
}
