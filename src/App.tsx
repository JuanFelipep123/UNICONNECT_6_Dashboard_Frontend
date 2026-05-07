import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { AppRouter } from './routes';
import { useAuthStore } from '@shared/store/authStore';
import { getAuthConfig, isValidInstitutionalEmail } from '@features/auth/services/authService';
import { syncUserWithBackend } from '@features/auth/services/authApiService';

function App() {
  const { isLoading, isAuthenticated, user, logout, getAccessTokenSilently } = useAuth0();
  const setSession = useAuthStore((state) => state.setSession);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  // Prevent running the sync more than once per session
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Still loading Auth0 state – do nothing
    if (isLoading) return;

    // Not authenticated → just mark hydration done (no backend sync needed)
    if (!isAuthenticated) {
      if (!hasSyncedRef.current) {
        setHydrated();
      }
      return;
    }

    // Already synced in this session – don't re-run
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const hydrate = async () => {
      // Validate institutional email
      if (!user?.email || !isValidInstitutionalEmail(user.email)) {
        await logout({ openUrl: false });
        // navigation handled by router guard after clearSession
        return;
      }

      const config = getAuthConfig();

      if (config.authSyncUrl) {
        try {
          const accessToken = await getAccessTokenSilently();
          const session = await syncUserWithBackend(config.authSyncUrl, accessToken);
          // Set session WITH the real needsOnboarding value from backend.
          // Router guards (ProtectedLayout / OnboardingLayout) will handle
          // the redirect once isHydrating becomes false.
          setSession({
            userId: session.userId,
            token: session.token,
            needsOnboarding: session.needsOnboarding,
          });
        } catch {
          // Sync failed: mark hydrated but do NOT reset needsOnboarding.
          // User lands on /groups; they can retry if needed.
          setSession({ userId: user.sub!, token: null, needsOnboarding: false });
        }
      } else {
        // No sync URL configured – treat as no onboarding needed
        setSession({ userId: user.sub!, token: null, needsOnboarding: false });
      }
    };

    void hydrate();
  }, [isLoading, isAuthenticated, user, logout, setSession, setHydrated, getAccessTokenSilently]);

  return <AppRouter />;
}

export default App;
