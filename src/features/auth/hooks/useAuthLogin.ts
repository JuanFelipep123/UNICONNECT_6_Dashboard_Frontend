import { useMemo, useState } from 'react';
import { buildAuthorizeUrl, getAuthConfig, validateAuthConfig } from '../services/authService';
import { createPkceSession } from '../services/pkce';

export function useAuthLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const authConfig = useMemo(() => getAuthConfig(), []);
  const missingConfig = useMemo(() => validateAuthConfig(authConfig), [authConfig]);

  const handleLogin = async () => {
    if (missingConfig.length > 0) {
      setErrorMessage(`Configuracion incompleta: ${missingConfig.join(', ')}`);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { state, challenge } = await createPkceSession();
      const authorizeUrl = buildAuthorizeUrl(authConfig, state, challenge);
      window.location.assign(authorizeUrl);
    } catch {
      setErrorMessage('No se pudo iniciar el flujo de autenticacion de Auth0.');
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    errorMessage,
    canLogin: !isLoading && missingConfig.length === 0,
    loginUnavailableReason: missingConfig.length > 0 ? `Faltan variables: ${missingConfig.join(', ')}` : null,
    handleLogin,
  };
}
