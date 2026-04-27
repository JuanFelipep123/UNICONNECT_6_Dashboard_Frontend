import { useAuth0 } from '@auth0/auth0-react';

export function useAuthCallback() {
  const { isLoading, error } = useAuth0();

  return {
    isLoading,
    errorMessage: error?.message ?? null,
  };
}
