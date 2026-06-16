import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Colors, Spacing, Radius, Typography, Layout } from '../../constants/theme';

export interface SidebarItem {
  key: string;
  label: string;
  icon: string; // emoji
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  variant: 'kid' | 'parent';
  title?: string;
  footer?: React.ReactNode;
}

const KID_STYLE = {
  bg: Colors.kidSidebarBg,
  activeBg: Colors.kidSidebarActive,
  activeText: Colors.kidSidebarActiveText,
  text: Colors.kidSidebarText,
  titleColor: Colors.secureBlue,
};

const PARENT_STYLE = {
  bg: Colors.parentSidebarBg,
  activeBg: Colors.parentSidebarActive,
  activeText: Colors.textWhite,
  text: Colors.parentSidebarMuted,
  titleColor: Colors.textWhite,
};

export function Sidebar({ items, activeKey, onSelect, variant, title = 'Centsible', footer }: SidebarProps) {
  const s = variant === 'kid' ? KID_STYLE : PARENT_STYLE;

  return (
    <View style={[styles.container, { backgroundColor: s.bg }]}>
      {/* Logo / Title */}
      <View style={styles.header}>
        <Text style={[styles.logo, { color: s.titleColor }]}>🐷</Text>
        <Text style={[styles.title, { color: s.titleColor }]}>{title}</Text>
      </View>

      {/* Nav items */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && { backgroundColor: s.activeBg }]}
              onPress={() => onSelect(item.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? s.activeText : s.text },
                  isActive && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
              {item.badge != null && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer slot */}
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: Layout.sidebarWidth,
    height: '100%',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  logo: {
    fontSize: 28,
  },
  title: {
    ...Typography.h3,
    fontWeight: '700',
  },
  nav: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  navIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  navLabel: {
    ...Typography.bodyLarge,
    flex: 1,
  },
  navLabelActive: {
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Colors.actionOrange,
    borderRadius: Radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
