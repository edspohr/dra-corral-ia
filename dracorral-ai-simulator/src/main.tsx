import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { checkRequiredEnvVars } from './utils/envCheck.ts';

if (import.meta.env.DEV) {
  checkRequiredEnvVars();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
