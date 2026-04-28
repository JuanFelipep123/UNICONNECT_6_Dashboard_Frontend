import { Auth0Provider } from '@auth0/auth0-react';
import type { AppState } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { getAuthConfig } from '../services/authService';

interface Auth0ProviderWithRouterProps {
  children: React.ReactNode;
}

export function Auth0ProviderWithRouter({ children }: Auth0ProviderWithRouterProps) {
  const navigate = useNavigate();
  const config = getAuthConfig();

  const onRedirectCallback = (appState: AppState | undefined) => {
    navigate(appState?.returnTo ?? '/groups', { replace: true });
  };

  return (
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={{
        redirect_uri: config.redirectUri,
        scope: 'openid profile email',
        connection: config.connection,
        ...(config.audience ? { audience: config.audience } : {}),
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
