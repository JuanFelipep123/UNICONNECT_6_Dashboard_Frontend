import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@shared/store/authStore';
import { syncUserWithBackend } from '../services/authApiService';
import {
  exchangeCodeForToken,
  fetchAuth0UserInfo,
  getAuthConfig,
  isValidInstitutionalEmail,
  validateAuthConfig,
} from '../services/authService';
import { assertValidState, clearPkceSession, getPkceVerifier } from '../services/pkce';

export function useAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const config = getAuthConfig();
        const missingConfig = validateAuthConfig(config);

        if (missingConfig.length > 0) {
          throw new Error(`Configuracion incompleta: ${missingConfig.join(', ')}`);
        }

        const error = searchParams.get('error');
        if (error) {
          const description = searchParams.get('error_description');
          throw new Error(description || 'Auth0 devolvio un error durante el login.');
        }

        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          throw new Error('No se recibio codigo de autorizacion.');
        }

        if (!assertValidState(state)) {
          throw new Error('Estado de seguridad invalido. Intenta iniciar sesion nuevamente.');
        }

        const codeVerifier = getPkceVerifier();
        if (!codeVerifier) {
          throw new Error('No se encontro PKCE verifier. Inicia sesion nuevamente.');
        }

        const accessToken = await exchangeCodeForToken({
          config,
          code,
          codeVerifier,
        });

        const userInfo = await fetchAuth0UserInfo(accessToken, config.domain);

        if (!userInfo.email || !isValidInstitutionalEmail(userInfo.email)) {
          throw new Error('Solo se permiten correos institucionales @ucaldas.edu.co');
        }

        if (!userInfo.name || !userInfo.sub) {
          throw new Error('No fue posible obtener nombre y sub desde Auth0.');
        }

        const backendSession = await syncUserWithBackend(config.authSyncUrl, accessToken);

        setSession({
          userId: backendSession.userId,
          token: backendSession.token,
          needsOnboarding: backendSession.needsOnboarding,
        });

        clearPkceSession();
        navigate('/groups', { replace: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error inesperado en callback de autenticacion.';
        setErrorMessage(message);
        clearPkceSession();
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [navigate, searchParams, setSession]);

  return { isLoading, errorMessage };
}
