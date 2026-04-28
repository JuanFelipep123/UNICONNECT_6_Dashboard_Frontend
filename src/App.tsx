import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { AppRouter } from './routes';
import { useAuthStore } from '@shared/store/authStore';
import { getAuthConfig, isValidInstitutionalEmail } from '@features/auth/services/authService';
import { syncUserWithBackend } from '@features/auth/services/authApiService';

function App() {
  const { isLoading, isAuthenticated, user, logout, getAccessTokenSilently } = useAuth0();
  const setSession = useAuthStore((state) => state.setSession);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setHydrated();
      return;
    }

    const hydrate = async () => {
      if (!user?.email || !isValidInstitutionalEmail(user.email)) {
        await logout({ openUrl: false });
        navigate('/login?error=email_not_allowed', { replace: true });
        return;
      }

      const config = getAuthConfig();

      if (config.authSyncUrl) {
        try {
          const accessToken = await getAccessTokenSilently();
          const session = await syncUserWithBackend(config.authSyncUrl, accessToken);
          setSession({ userId: session.userId, token: session.token, needsOnboarding: session.needsOnboarding });
        } catch {
          setSession({ userId: user.sub!, token: null });
        }
      } else {
        setSession({ userId: user.sub!, token: null });
      }
    };

    void hydrate();
  }, [isLoading, isAuthenticated, user, logout, navigate, setSession, setHydrated, getAccessTokenSilently]);

  return <AppRouter />;
}

export default App;
