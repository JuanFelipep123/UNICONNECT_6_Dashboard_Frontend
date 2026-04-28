import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0ProviderWithRouter } from '@features/auth/providers/Auth0ProviderWithRouter';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithRouter>
        <App />
      </Auth0ProviderWithRouter>
    </BrowserRouter>
  </StrictMode>,
);
