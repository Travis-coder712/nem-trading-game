import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode removed — it double-mounts effects in dev, which caused
  // transition overlays to replay endlessly. Safe for production; the app
  // doesn't rely on StrictMode-only warnings.
  <BrowserRouter>
    <SocketProvider>
      <App />
    </SocketProvider>
  </BrowserRouter>,
);
