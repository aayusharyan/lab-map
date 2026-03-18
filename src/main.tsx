// Application entry point - mounts React app to the DOM with context providers
// Provider hierarchy: SettingsProvider (outer) > AppProvider (inner) > App
// This order ensures settings are available to all components throughout the app

// External dependencies (alphabetical)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Internal dependencies (alphabetical)
import { AppProvider } from '@/context/AppContext';
import { SettingsProvider } from '@/context/SettingsContext';

import App from './App';

// Styles
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
