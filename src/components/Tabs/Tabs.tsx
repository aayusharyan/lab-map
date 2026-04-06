/**
 * @file Tabs.tsx
 * @description Generic tab navigation component with multiple visual variants
 *
 * Reusable tabs component that renders a row of selectable buttons. Used by
 * AppHeader for page navigation and AppSubHeader for flow filtering. Parents
 * control the active state and handle selection via callbacks.
 *
 * Features:
 * - Generic type support for type-safe tab IDs
 * - Multiple visual variants (header tabs, pill filters)
 * - Optional "all" option for filter-style usage
 * - ARIA roles for accessibility
 *
 * @example
 * // Header-style page tabs
 * <Tabs
 *   items={[{ id: 'physical', label: 'Physical' }, { id: 'traffic', label: 'Traffic' }]}
 *   activeId={activePage}
 *   onSelect={setActivePage}
 *   variant="header"
 * />
 *
 * @example
 * // Pill-style filter tabs with "all" option
 * <Tabs
 *   items={flows.map(f => ({ id: f.id, label: f.label }))}
 *   activeId={activeFlowId}
 *   onSelect={setActiveFlowId}
 *   variant="pill"
 *   allOption={{ label: 'All flows' }}
 * />
 *
 * @see Tabs.types.ts - Type definitions
 * @see AppHeader.tsx - Uses header variant for page navigation
 * @see AppSubHeader.tsx - Uses pill variant for flow filtering
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import styles from './Tabs.module.css';

import type { TabsProps } from './Tabs.types';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * Generic tab navigation component.
 *
 * Renders a row of tab buttons with the active tab highlighted. Parent
 * components control state and handle selection through props.
 *
 * @template T - Type of tab IDs for type safety
 * @param props - Component props (see TabsProps)
 * @returns Tab navigation element
 */
export function Tabs<T extends string = string>({
  items,
  activeId,
  onSelect,
  variant = 'header',
  allOption,
  className,
}: TabsProps<T>) {
  /* Determine CSS classes based on variant */
  const containerClass = variant === 'pill' ? styles.pills : styles.tabs;
  const itemClass = variant === 'pill' ? styles.pill : styles.tab;

  return (
    <nav
      className={`${containerClass}${className ? ` ${className}` : ''}`}
      role="tablist"
    >
      {/* Optional "all" option (pill variant only) */}
      {allOption && (
        <button
          className={`${itemClass} ${styles.pillAll}${activeId === null ? ` ${styles.active}` : ''}`}
          role="tab"
          aria-selected={activeId === null}
          title={allOption.title ?? allOption.label}
          onClick={() => onSelect(null)}
        >
          {allOption.label}
        </button>
      )}

      {/* Tab items */}
      {items.map((item) => (
        <button
          key={item.id}
          className={`${itemClass}${activeId === item.id ? ` ${styles.active}` : ''}`}
          role="tab"
          aria-selected={activeId === item.id}
          title={item.title ?? item.label}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
