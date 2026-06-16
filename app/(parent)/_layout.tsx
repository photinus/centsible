import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router, usePathname, Slot } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { useDataStore } from '../../store/dataStore';
import { useResponsive } from '../../hooks/useResponsive';
import { Sidebar, SidebarItem } from '../../components/shared/Sidebar';
import { BottomTabBar } from '../../components/shared/BottomTabBar';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { Colors, Spacing, Typography } from '../../constants/theme';

const PARENT_TABS = [
  { key: '/(parent)/', label: 'Dashboard', icon: '🏠' },
  { key: '/(parent)/family', label: 'Family', icon: '👨‍👩‍👧' },
  { key: '/(parent)/approvals', label: 'Approvals', icon: '✅' },
  { key: '/(parent)/chores-market', label: 'Chores', icon: '📋' },
];

export default function ParentLayout() {
  const { session, isLoading, signOut } = useAuth();
  useHousehold();
  const { pendingApprovalCount } = useDataStore();
  const { isTablet } = useResponsive();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && !session) router.replace('/(auth)/login');
    if (!isLoading && session?.role === 'kid') router.replace('/(kid)/');
  }, [isLoading, session]);

  if (isLoading || !session) return <LoadingScreen />;

  function navigate(key: string) {
    router.push(key as Parameters<typeof router.push>[0]);
  }

  const activeKey = pathname === '/' ? '/(parent)/' : pathname;

  const sidebarItems: SidebarItem[] = PARENT_TABS.map((t) => ({
    ...t,
    badge: t.key === '/(parent)/approvals' ? pendingApprovalCount : undefined,
  }));

  const tabItems = PARENT_TABS.map((t) => ({
    key: t.key,
    label: t.label,
    icon: t.icon,
    badge: t.key === '/(parent)/approvals' ? pendingApprovalCount : undefined,
  }));

  const sidebarFooter = (
    <View style={styles.footerButtons}>
      <TouchableOpacity onPress={() => navigate('/(parent)/settings')} style={styles.footerBtn}>
        <Text style={styles.footerBtnText}>⚙️ Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={signOut} style={[styles.footerBtn, styles.signOutBtn]}>
        <Text style={[styles.footerBtnText, styles.signOutText]}>↩ Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  if (isTablet) {
    return (
      <View style={styles.tabletContainer}>
        <Sidebar
          items={sidebarItems}
          activeKey={activeKey}
          onSelect={navigate}
          variant="parent"
          title="Centsible"
          footer={sidebarFooter}
        />
        <View style={styles.tabletContent}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.phoneContainer}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <BottomTabBar items={tabItems} activeKey={activeKey} onSelect={navigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabletContainer: { flex: 1, flexDirection: 'row', backgroundColor: Colors.appBackground },
  tabletContent: { flex: 1, backgroundColor: Colors.appBackground },
  phoneContainer: { flex: 1, backgroundColor: Colors.appBackground },
  footerButtons: { gap: Spacing.xs },
  footerBtn: { paddingVertical: 10, paddingHorizontal: Spacing.sm, borderRadius: 8 },
  footerBtnText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 14 },
  signOutBtn: { marginTop: Spacing.xs },
  signOutText: { color: 'rgba(255,255,255,0.5)' },
});
