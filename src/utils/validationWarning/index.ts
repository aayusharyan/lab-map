/**
 * @file index.ts
 * @description Barrel export for validation warning utilities
 *
 * Public API:
 * - Helpers:
 *   - getValidationWarningHash
 * - Types:
 *   - ValidationWarning
 *   - ValidationWarningInput
 *
 * Import style:
 * import { getValidationWarningHash, type ValidationWarning } from '@/utils/validationWarning';
 */

export { getValidationWarningHash } from './validationWarning';
export type { ValidationWarning, ValidationWarningInput } from './validationWarning.types';
