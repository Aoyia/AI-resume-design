'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  isLoggedIn: boolean;
  user: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      login: (username, password) => {
        if (username === 'admin' && password === '123456') {
          set({ isLoggedIn: true, user: username });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ isLoggedIn: false, user: null });
      },
    }),
    {
      name: 'resume_auth_state',
    }
  )
);
