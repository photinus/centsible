import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { signOut as firebaseSignOut } from '../services/auth';
import { stopNetworkMonitor } from '../services/offline';

export function useAuth() {
  const { session, isLoading, setSession, clearSession } = useAuthStore();
  const clearData = useDataStore((s) => s.clearData);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut();
    } catch {
      // Ignore errors (e.g., already signed out)
    }
    stopNetworkMonitor();
    await clearSession();
    clearData();
  }, [clearSession, clearData]);

  return {
    session,
    isLoading,
    isAuthenticated: session !== null,
    isParent: session?.role === 'parent',
    isKid: session?.role === 'kid',
    memberId: session?.memberId ?? null,
    householdId: session?.householdId ?? null,
    setSession,
    signOut,
  };
}
