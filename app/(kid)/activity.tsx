import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../hooks/useHousehold';
import { useDataStore } from '../../store/dataStore';
import { ActivityItem } from '../../components/kid/ActivityItem';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import type { Transaction } from '../../types';

const FILTERS = ['All', 'Earned', 'Spent', 'Interest'] as const;
type Filter = typeof FILTERS[number];

export default function KidActivityScreen() {
  const insets = useSafeAreaInsets();
  const { refresh } = useHousehold();
  const { transactions } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const approved = transactions.filter((t) => t.status === 'approved');
  const pending = transactions.filter((t) => t.status === 'pending');

  function applyFilter(txs: Transaction[]): Transaction[] {
    switch (filter) {
      case 'Earned': return txs.filter((t) => ['chore_reward', 'allowance', 'deposit', 'interest'].includes(t.type));
      case 'Spent': return txs.filter((t) => ['withdrawal', 'goal_contribution'].includes(t.type));
      case 'Interest': return txs.filter((t) => t.type === 'interest');
      default: return txs;
    }
  }

  const filtered = applyFilter(approved).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
    >
      <Text style={styles.title}>📊 Activity</Text>

      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <View key={f} style={[styles.chip, filter === f && styles.chipActive]}>
            <Text
              style={[styles.chipText, filter === f && styles.chipTextActive]}
              onPress={() => setFilter(f)}
            >
              {f}
            </Text>
          </View>
        ))}
      </View>

      {/* Pending section */}
      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Approval</Text>
          {pending.map((tx) => (
            <View key={tx.id} style={styles.pendingRow}>
              <ActivityItem transaction={tx} />
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>⏱ Pending</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>History</Text>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No transactions yet. Complete a chore to get started!</Text>
        ) : (
          filtered.map((tx) => <ActivityItem key={tx.id} transaction={tx} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },
  title: { ...Typography.h2 },
  filters: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: Radius.full,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.growthGreen, borderColor: Colors.growthGreen },
  chipText: { ...Typography.body, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.white },
  section: { gap: Spacing.xs },
  sectionTitle: { ...Typography.h4, color: Colors.textSecondary, marginBottom: Spacing.xs },
  empty: { ...Typography.bodyLarge, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  pendingRow: { position: 'relative' },
  pendingBadge: {
    position: 'absolute', right: 0, top: Spacing.sm,
    backgroundColor: Colors.pendingBg, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  pendingBadgeText: { color: Colors.pending, fontSize: 11, fontWeight: '600' },
});
