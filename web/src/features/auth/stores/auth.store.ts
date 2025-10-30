import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (token, user) => set({ accessToken: token, user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'mandai-auth',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    },
  ),
);
