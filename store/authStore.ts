import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSession } from '../types';

const SESSION_KEY = '@centsible:session';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  /** Set a new session (called after login) */
  setSession: (session: AuthSession) => Promise<void>;
  /** Clear session (called on logout) */
  clearSession: () => Promise<void>;
  /** Rehydrate session from AsyncStorage on app start */
  rehydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,

  setSession: async (session) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    set({ session });
  },

  clearSession: async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ session: null });
  },

  rehydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (raw) {
        const session: AuthSession = JSON.parse(raw);
        set({ session, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
