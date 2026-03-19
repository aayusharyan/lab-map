/**
 * @file main.tsx
 * @description Application entry point - mounts React app to the DOM
 *
 * This is the main entry point for the Lab Map application. It initializes the
 * React root and mounts the application to the DOM with the necessary context
 * providers wrapped around it.
 *
 * Provider Hierarchy:
 *   StrictMode (React development checks)
 *     └─ SettingsProvider (theme, font size, UI preferences)
 *         └─ AppProvider (topology data, selected node, active layer)
 *             └─ App (root component)
 *
 * This hierarchy ensures that:
 * 1. Settings are available to all components (outermost provider)
 * 2. App state can access settings when needed
 * 3. StrictMode catches potential issues during development
 *
 * Entry Point:
 * - Vite uses this file as the main entry (configured in index.html)
 * - Mounts to the #root element in public/index.html
 */

/* ============================================================================
 * STYLES
 * Global CSS must be imported FIRST to ensure correct Vite processing
 * ============================================================================ */

import './styles/index.css';

/* ============================================================================
 * IMPORTS
 * ============================================================================ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProvider } from '@/context/AppContext';
import { SettingsProvider } from '@/context/SettingsContext';

import App from './App';

/* ============================================================================
 * APPLICATION BOOTSTRAP
 * Create React root and mount the application with context providers
 * ============================================================================ */

/**
 * Get the root DOM element where React will mount.
 * The non-null assertion (!) is safe because index.html always has #root.
 */
const rootElement = document.getElementById('root')!;

/**
 * Create the React root using React 18's createRoot API.
 * This enables concurrent features and automatic batching.
 */
const root = createRoot(rootElement);

/**
 * Render the application with context providers.
 *
 * Provider order matters:
 * - SettingsProvider: Outermost, provides theme/UI settings to entire app
 * - AppProvider: Inner, provides topology data and selection state
 */
root.render(
  <StrictMode>
    <SettingsProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </SettingsProvider>
  </StrictMode>
);
