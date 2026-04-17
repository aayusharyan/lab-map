/**
 * @file vite.config.ts
 * @description Vite build configuration for Lab Map
 *
 * This configuration file sets up Vite for building and serving the Lab Map
 * React application. It configures the React plugin for JSX transformation
 * and Fast Refresh (HMR), sets up path aliases for cleaner imports, and
 * defines the development server settings.
 *
 * Features:
 * - React plugin with Fast Refresh for instant HMR during development
 * - Path alias: @/ maps to src/ for cleaner import statements
 * - Static assets served from public/ directory
 * - Development server runs on port 5173 (Vite default)
 *
 * Build Output:
 * - Production build outputs to dist/ directory
 * - Optimized for modern browsers (ES2020 target via tsconfig.json)
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/* ============================================================================
 * ESM PATH RESOLUTION
 * ESM modules don't have __dirname built-in, so we derive it from import.meta.url.
 * This is required for resolving the path alias below.
 * ============================================================================ */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ============================================================================
 * VITE CONFIGURATION
 * ============================================================================ */

export default defineConfig({
  /**
   * Vite plugins array
   * - react(): Enables JSX transformation and React Fast Refresh (HMR)
   *   Using babel for JSX transform to ensure proper preamble injection
   */
  plugins: [react()],

  /**
   * Public directory for static assets
   * Files in public/ are served at the root URL and copied as-is to dist/
   */
  publicDir: 'public',

  /**
   * Module resolution configuration
   */
  resolve: {
    /**
     * Path aliases for cleaner imports
     * @/ maps to src/, so you can write:
     *   import { useAppContext } from '@/hooks/useAppContext'
     * instead of:
     *   import { useAppContext } from '../../hooks/useAppContext'
     */
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  /**
   * Development server configuration
   */
  server: {
    /**
     * Port for the dev server
     * Access the app at http://localhost:5173
     */
    port: 5173,
  },
});
