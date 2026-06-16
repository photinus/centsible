import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../hooks/useAuth';
import { useDataStore } from '../../store/dataStore';
import { useResponsive } from '../../hooks/useResponsive';
import { ChildColumn } from '../../components/parent/ChildColumn';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { getGoalsByMember, getTransactionsByMember } from '../../services/firestore';
import type { Member, Goal, Transaction } from '../../types';

export default function FamilyOverviewScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refresh } = useHousehold();
  const { allMembers } = useDataStore();
  const { isTablet } = useResponsive();

  const [refreshing, setRefreshing] = useState(false);
  const [kidData, setKidData] = useState<Record<string, { goals: Goal[]; txs: Transaction[] }>>({});

  const kids = allMembers.filter((m) => m.role === 'kid');

  useEffect(() => {
    loadKidData();
  }, [allMembers.length]);

  async function loadKidData() {
    const results: Record<string, { goals: Goal[]; txs: Transaction[] }> = {};
    await Promise.all(
      kids.map(async (kid) => {
        const [goals, txs] = await Promise.all([
          getGoalsByMember(kid.id),
          getTransactionsByMember(kid.id, 20),
        ]);
        results[kid.id] = { goals, txs };
      })
    );
    setKidData(results);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    await loadKidData();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
    >
      <Text style={styles.title}>Family Overview | Savings Review</Text>

      {kids.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👨‍👩‍👧</Text>
          <Text style={styles.emptyTitle}>No kids yet</Text>
          <Text style={styles.emptyDesc}>Go to Settings to add your children.</Text>
        </View>
      ) : (
        <View style={[styles.columnsRow, !isTablet && styles.columnsStack]}>
          {kids.map((kid) => (
            <ChildColumn
              key={kid.id}
              member={kid}
              goals={kidData[kid.id]?.goals ?? []}
              recentTransactions={kidData[kid.id]?.txs ?? []}
              onEditGoal={() => {}}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.lg },
  title: { ...Typography.h2 },
  columnsRow: { flexDirection: 'row', gap: Spacing.md },
  columnsStack: { flexDirection: 'column' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { ...Typography.h2 },
  emptyDesc: { ...Typography.bodyLarge, color: Colors.textMuted, textAlign: 'center' },
});
