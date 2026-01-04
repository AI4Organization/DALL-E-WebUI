import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { ThemedApp } from './components/ThemedApp';
import { ImageProvider } from './contexts/ImageContext';
import { ThemeProvider } from './lib/theme';
import './styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ThemedApp>
        <ImageProvider>
          <App />
        </ImageProvider>
      </ThemedApp>
    </ThemeProvider>
  </React.StrictMode>
);
