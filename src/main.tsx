import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0ProviderWithRouter } from '@features/auth/providers/Auth0ProviderWithRouter';
import { ToastProvider } from '@shared/components/ui/ToastProvider';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </Auth0ProviderWithRouter>
    </BrowserRouter>
  </StrictMode>,
);
