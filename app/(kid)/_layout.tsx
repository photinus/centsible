import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { useResponsive } from '../../hooks/useResponsive';
import { Sidebar } from '../../components/shared/Sidebar';
import { BottomTabBar } from '../../components/shared/BottomTabBar';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { Colors, Layout } from '../../constants/theme';

const KID_TABS = [
  { key: '/(kid)/', label: 'Home', icon: '🏠' },
  { key: '/(kid)/chores', label: 'Chores', icon: '✅' },
  { key: '/(kid)/activity', label: 'Activity', icon: '📊' },
  { key: '/(kid)/goals', label: 'Goals', icon: '🎯' },
];

export default function KidLayout() {
  const { session, isLoading } = useAuth();
  const { refresh } = useHousehold();
  const { isTablet } = useResponsive();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && !session) router.replace('/(auth)/login');
    if (!isLoading && session?.role === 'parent') router.replace('/(parent)/');
  }, [isLoading, session]);

  if (isLoading || !session) return <LoadingScreen />;

  function navigate(key: string) {
    router.push(key as Parameters<typeof router.push>[0]);
  }

  // Normalise pathname for active key matching
  const activeKey = pathname === '/' ? '/(kid)/' : pathname;

  if (isTablet) {
    return (
      <View style={styles.tabletContainer}>
        <Sidebar
          items={KID_TABS.map((t) => ({ ...t, key: t.key }))}
          activeKey={activeKey}
          onSelect={navigate}
          variant="kid"
          footer={null}
        />
        <View style={styles.tabletContent}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.phoneContainer, { paddingBottom: 0 }]}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <BottomTabBar
        items={KID_TABS.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
        activeKey={activeKey}
        onSelect={navigate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.appBackground,
  },
  tabletContent: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  phoneContainer: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
});
