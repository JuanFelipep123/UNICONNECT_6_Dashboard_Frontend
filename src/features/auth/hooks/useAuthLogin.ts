import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useSearchParams } from 'react-router-dom';
import { getAuthConfig } from '../services/authService';

export function useAuthLogin() {
  const { loginWithRedirect, isLoading: auth0Loading } = useAuth0();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hookError, setHookError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const config = getAuthConfig();
  const missingConfig: string[] = [];
  if (!config.domain) missingConfig.push('VITE_AUTH0_DOMAIN');
  if (!config.clientId) missingConfig.push('VITE_AUTH0_CLIENT_ID');

  const urlError = searchParams.get('error');
  const errorMessage =
    hookError ??
    (urlError === 'email_not_allowed' ? 'Solo se permiten correos institucionales @ucaldas.edu.co' : null);

  const handleLogin = async () => {
    if (missingConfig.length > 0) {
      setHookError(`Configuracion incompleta: ${missingConfig.join(', ')}`);
      return;
    }

    setHookError(null);
    setIsRedirecting(true);

    try {
      await loginWithRedirect({
        authorizationParams: { connection: config.connection },
      });
    } catch {
      setHookError('No se pudo iniciar el flujo de autenticacion de Auth0.');
      setIsRedirecting(false);
    }
  };

  const isLoading = isRedirecting || auth0Loading;

  return {
    isLoading,
    errorMessage,
    canLogin: !isLoading && missingConfig.length === 0,
    loginUnavailableReason: missingConfig.length > 0 ? `Faltan variables: ${missingConfig.join(', ')}` : null,
    handleLogin,
  };
}
