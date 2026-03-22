/**
 * @file vite-env.d.ts
 * @description Ambient Vite type entrypoint for this repository
 *
 * Why this file exists:
 * Vite ships a `vite/client` declaration bundle that augments TypeScript with
 * Vite-specific globals and module declarations used by frontend code.
 *
 * What this enables:
 * - `import.meta.env` and related Vite runtime env typing
 * - Asset/module import typing provided by Vite (including CSS Modules)
 * - Consistent editor IntelliSense and `tsc` behavior for Vite projects
 *
 * Project convention:
 * - Keep this file at `src/vite-env.d.ts` so it is included by `tsconfig.json`
 *   (`include: ["src"]`).
 * - Prefer this single Vite entrypoint over custom per-feature ambient files
 *   when Vite already provides the declaration.
 *
 * Maintenance notes:
 * - Do not duplicate overlapping declarations (for example, a separate
 *   `declare module '*.module.css'`) unless a concrete gap is identified.
 * - If custom ambient declarations are needed, scope them narrowly and place
 *   them in `src/types/` with clear ownership comments.
 */
/// <reference types="vite/client" />
