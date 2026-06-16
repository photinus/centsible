import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/theme';
import type { SyncStatus } from '../../types';

const STATUS_CONFIG: Record<SyncStatus, { label: string; bg: string; color: string }> = {
  synced: { label: '✓ Synced', bg: Colors.approvedBg, color: Colors.approved },
  syncing: { label: '↻ Syncing…', bg: Colors.pendingBg, color: Colors.pending },
  pending: { label: '⏱ Pending sync', bg: Colors.pendingBg, color: Colors.pending },
  offline: { label: '✕ Offline', bg: Colors.deniedBg, color: Colors.denied },
};

export function SyncBadge({ status }: { status: SyncStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
