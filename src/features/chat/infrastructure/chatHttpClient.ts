import { CHAT_BASE_URL } from '@shared/services/api/apiClient';
import { useAuthStore } from '@shared/store/authStore';

export async function chatFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const userId = useAuthStore.getState().userId;

  return fetch(`${CHAT_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}
