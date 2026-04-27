import { useEffect } from 'react';
import { AppRouter } from './routes';
import { useAuthStore } from '@shared/store/authStore';
import { getAuthConfig } from '@features/auth/services/authService';
import { restoreSessionFromBackend } from '@features/auth/services/authApiService';

function App() {
  const setSession = useAuthStore((state) => state.setSession);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    const hydrate = async () => {
      const authConfig = getAuthConfig();
      const session = await restoreSessionFromBackend(authConfig.authSessionUrl);

      if (session) {
        setSession({
          userId: session.userId,
          token: session.token,
          needsOnboarding: session.needsOnboarding,
        });
        return;
      }

      setHydrated();
    };

    void hydrate();
  }, [setHydrated, setSession]);

  return <AppRouter />;
}

export default App;
