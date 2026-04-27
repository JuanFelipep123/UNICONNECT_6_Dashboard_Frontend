import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  token: string | null;
  needsOnboarding: boolean;
  isHydrating: boolean;
  setSession: (session: { userId: string; token: string | null; needsOnboarding?: boolean }) => void;
  setHydrated: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  token: null,
  needsOnboarding: false,
  isHydrating: true,

  setSession: ({ userId, token, needsOnboarding = false }) => {
    set({ userId, token, needsOnboarding, isHydrating: false });
  },

  setHydrated: () => {
    set({ isHydrating: false });
  },

  clearSession: () => {
    set({ userId: null, token: null, needsOnboarding: false, isHydrating: false });
  },
}));
