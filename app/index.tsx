import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { LoadingScreen } from '../components/shared/LoadingScreen';

/**
 * Root index — redirects to the appropriate screen based on auth state.
 */
export default function Index() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Starting Centsible…" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.role === 'parent') {
    return <Redirect href="/(parent)/" />;
  }

  return <Redirect href="/(kid)/" />;
}
