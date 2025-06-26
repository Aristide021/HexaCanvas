import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { enableMapSet } from 'immer';
import App from './App.tsx';
import './index.css';

// Enable Immer MapSet plugin for handling Map and Set objects
enableMapSet();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);