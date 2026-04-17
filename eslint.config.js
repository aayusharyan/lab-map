/**
 * @file eslint.config.js
 * @description ESLint flat configuration for Lab Map
 *
 * This configuration file sets up ESLint using the new flat config format
 * (eslint.config.js) introduced in ESLint v8.21+. It enforces code quality
 * and consistency rules for React + TypeScript development.
 *
 * Features:
 * - React and React Hooks linting rules
 * - TypeScript-specific rules via typescript-eslint
 * - Import organization and ordering
 * - React Fast Refresh compatibility checking
 *
 * Usage:
 *   pnpm lint       # Check for linting errors
 *   pnpm lint:fix   # Auto-fix linting errors where possible
 *
 * Import Order (enforced automatically):
 *   1. Node.js built-ins (fs, path, crypto)
 *   2. External packages (react, vis-network, konva)
 *   3. Internal modules (@/ aliases, alphabetized)
 *   4. Relative imports (parent, sibling, index)
 *   5. Type imports
 */

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

/* ============================================================================
 * ESLINT CONFIGURATION
 * Using typescript-eslint's config helper for type-safe flat config
 * ============================================================================ */

export default tseslint.config(
  /* ==========================================================================
   * IGNORED PATHS
   * Files and directories that should not be linted
   * ========================================================================== */
  {
    ignores: [
      'dist',           /* Build output */
      'node_modules',   /* Dependencies */
      '.vite',          /* Vite cache */
      '*.config.js',    /* Config files (this file) */
      'watcher.js',     /* File watcher (plain JS) */
    ],
  },

  /* ==========================================================================
   * BASE CONFIGURATIONS
   * Recommended rules from ESLint and TypeScript-ESLint
   * ========================================================================== */
  js.configs.recommended,
  ...tseslint.configs.recommended,

  /* ==========================================================================
   * MAIN CONFIGURATION
   * Custom rules for the Lab Map codebase
   * ========================================================================== */
  {
    /**
     * File patterns to lint
     * Includes all JavaScript and TypeScript files (including JSX/TSX)
     */
    files: ['**/*.{js,jsx,ts,tsx}'],

    /**
     * ESLint plugins
     * Each plugin provides additional rules for specific frameworks/tools
     */
    plugins: {
      react,                          /* React-specific rules */
      'react-hooks': reactHooks,      /* Rules of Hooks enforcement */
      'react-refresh': reactRefresh,  /* Fast Refresh compatibility */
      import: importPlugin,           /* Import organization */
    },

    /**
     * Language options
     * Parser settings for modern JavaScript with JSX support
     */
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    /**
     * Plugin settings
     * Configuration for plugins that need additional context
     */
    settings: {
      /**
       * React version detection
       * Automatically detects React version from package.json
       */
      react: {
        version: 'detect',
      },

      /**
       * Import resolver configuration
       * Enables ESLint to understand TypeScript paths and aliases
       */
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: true,
      },
    },

    /**
     * Linting rules
     */
    rules: {
      /* ======================================================================
       * REACT RULES
       * Enforce React best practices and prevent common mistakes
       * ====================================================================== */

      /**
       * React recommended rules (prop-types, key warnings, etc.)
       */
      ...react.configs.recommended.rules,

      /**
       * React 17+ JSX transform rules (no need to import React)
       */
      ...react.configs['jsx-runtime'].rules,

      /**
       * React Hooks rules (exhaustive deps, rules of hooks)
       */
      ...reactHooks.configs.recommended.rules,

      /**
       * React Refresh compatibility
       * Warns when components aren't compatible with Fast Refresh HMR
       * allowConstantExport: permits exporting constants alongside components
       */
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      /* ======================================================================
       * IMPORT ORGANIZATION RULES
       * Enforce consistent import ordering and prevent duplicates
       * ====================================================================== */

      /**
       * Import order enforcement
       * Groups imports in a consistent, readable order
       */
      'import/order': ['error', {
        'groups': [
          'builtin',        /* Node.js built-ins (fs, path, etc.) */
          'external',       /* npm packages (react, vis-network) */
          'internal',       /* @/ path aliases */
          ['parent', 'sibling', 'index'],  /* Relative imports */
          'type',           /* TypeScript type imports */
          'object',
        ],
        'pathGroups': [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'after',
          },
        ],
        'pathGroupsExcludedImportTypes': ['builtin'],
        'alphabetize': {
          order: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
      }],

      /**
       * Prevent duplicate imports from the same module
       */
      'import/no-duplicates': 'error',

      /**
       * Imports must be at the top of the file
       */
      'import/first': 'error',

      /**
       * Require a newline after the import section
       */
      'import/newline-after-import': 'error',

      /* ======================================================================
       * TYPESCRIPT RULES
       * TypeScript-specific linting rules
       * ====================================================================== */

      /**
       * Unused variables warning
       * Allows unused variables prefixed with underscore (_unused)
       */
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      /**
       * Explicit any warning
       * Warns when 'any' type is used (prefer explicit types)
       */
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
