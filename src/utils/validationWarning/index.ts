/**
 * @file index.ts
 * @description Barrel export for validation warning utilities
 *
 * Re-exports public API for the validation warning utility module:
 * - getValidationWarningHash: Stable hash helper for dismissal tracking
 * - Types: ValidationWarning
 */

export { getValidationWarningHash } from './validationWarning';
export type { ValidationWarning, ValidationWarningInput } from './validationWarning.types';
