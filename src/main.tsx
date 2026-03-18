/**
 * Application entry point - mounts React app to the DOM with context providers.
 * Provider hierarchy: SettingsProvider (outer) > AppProvider (inner) > App
 * This order ensures settings are available to all components throughout the app.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProvider } from '@/context/AppContext';
import { SettingsProvider } from '@/context/SettingsContext';

import App from './App';

import './styles/style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </SettingsProvider>
  </StrictMode>
);
