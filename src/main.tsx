import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { db } from './lib/db';
import './index.css';

// Ask the browser not to evict IndexedDB under storage pressure.
navigator.storage?.persist?.().catch(() => undefined);
db.open().catch((e) => console.error('Could not open local database', e));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
