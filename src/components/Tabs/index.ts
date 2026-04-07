/**
 * @file index.ts
 * @description Barrel export for Tabs
 *
 * Public API:
 * - Tabs: tab-strip component supporting multiple visual variants
 * - type TabItem: data shape for a single tab entry
 * - type TabsProps: props for the Tabs component
 * - type TabsVariant: union of supported visual variant identifiers
 *
 * @see Tabs.tsx - Component implementation
 * @see Tabs.types.ts - Type contracts
 *
 * Import style:
 * import { Tabs, type TabItem, type TabsProps, type TabsVariant } from '@/components/Tabs';
 */

export { Tabs } from './Tabs';
export type { TabItem, TabsProps, TabsVariant } from './Tabs.types';
