/**
 * @file index.ts
 * @description Barrel export for NotificationContext module
 *
 * Public API:
 * - Context:
 *   - NotificationProvider
 *   - NotificationContext
 * - Types:
 *   - NotificationState
 *   - NotificationAction
 *
 * Import style:
 * import { NotificationProvider, type NotificationState } from '@/context/NotificationContext';
 */

export { NotificationProvider } from './NotificationContext';
export { NotificationContext } from './NotificationContext.types';
export type { NotificationState, NotificationAction } from './NotificationContext.types';
