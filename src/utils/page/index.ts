/**
 * @file index.ts
 * @description Barrel export for page utilities
 *
 * Public API:
 * - Constants:
 *   - PAGES
 *   - PAGE_IDS
 * - Helpers:
 *   - isPageId
 *   - buildPageDataOrThrow
 *   - makeTitleEl
 * - Types:
 *   - Page
 *   - PageId
 *   - Flow
 *   - PageData
 */

export { PAGES, PAGE_IDS, isPageId, buildPageDataOrThrow, makeTitleEl } from './page';
export type { Page, PageId, Flow, PageData } from './page.types';
