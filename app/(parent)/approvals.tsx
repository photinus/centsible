import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../hooks/useAuth';
import { useDataStore } from '../../store/dataStore';
import { TransactionActionCard, ChoreActionCard } from '../../components/parent/ActionCard';
import { Colors, Spacing, Typography } from '../../constants/theme';
import {
  approveTransaction, denyTransaction,
  approveChoreCompletion, denyChoreCompletion,
  getPendingTransactionsByHousehold,
} from '../../services/firestore';
import { enqueueAction, isOnline } from '../../services/offline';
import type { Transaction, ChoreCompletion } from '../../types';

export default function ApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refresh } = useHousehold();
  const { allMembers } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [pendingTxs, setPendingTxs] = useState<Transaction[]>([]);
  const [pendingCCs, setPendingCCs] = useState<ChoreCompletion[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { if (session) loadAll(); }, [session]);

  async function loadAll() {
    if (!session) return;
    const txs = await getPendingTransactionsByHousehold(session.householdId);
    setPendingTxs(txs);

    const { query, collection, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../../services/firebase');
    const snap = await getDocs(query(collection(db, 'choreCompletions'), where('householdId', '==', session.householdId), where('status', '==', 'pending')));
    setPendingCCs(snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, submittedAt: data.submittedAt?.toDate?.() ?? new Date() } as ChoreCompletion;
    }));
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    await loadAll();
    setRefreshing(false);
  }

  async function handleApproveTx(id: string) {
    if (!session) return;
    setActionLoading(id);
    try {
      if (await isOnline()) await approveTransaction(id, session.memberId);
      else await enqueueAction('approve_transaction', { transactionId: id, approverId: session.memberId });
      setPendingTxs((p) => p.filter((t) => t.id !== id));
    } finally { setActionLoading(null); }
  }

  async function handleDenyTx(id: string) {
    if (!session) return;
    setActionLoading(id);
    try { await denyTransaction(id, session.memberId); setPendingTxs((p) => p.filter((t) => t.id !== id)); }
    finally { setActionLoading(null); }
  }

  async function handleApproveCC(id: string) {
    if (!session) return;
    setActionLoading(id);
    try {
      if (await isOnline()) await approveChoreCompletion(id, session.memberId);
      else await enqueueAction('approve_chore', { completionId: id, approverId: session.memberId });
      setPendingCCs((p) => p.filter((c) => c.id !== id));
    } finally { setActionLoading(null); }
  }

  async function handleDenyCC(id: string) {
    if (!session) return;
    setActionLoading(id);
    try { await denyChoreCompletion(id, session.memberId); setPendingCCs((p) => p.filter((c) => c.id !== id)); }
    finally { setActionLoading(null); }
  }

  function name(id: string) { return allMembers.find((m) => m.id === id)?.name ?? 'Child'; }
  function avatar(id: string) { return allMembers.find((m) => m.id === id)?.avatarEmoji ?? '🧒'; }

  const total = pendingTxs.length + pendingCCs.length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>✅ Approvals</Text>
        {total > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{total}</Text></View>
        )}
      </View>

      {total === 0 ? (
        <View style={styles.allClear}>
          <Text style={styles.allClearIcon}>🎉</Text>
          <Text style={styles.allClearTitle}>All caught up!</Text>
          <Text style={styles.allClearDesc}>Nothing waiting for your approval.</Text>
        </View>
      ) : (
        <>
          {pendingTxs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Money Requests</Text>
              {pendingTxs.map((tx) => (
                <TransactionActionCard
                  key={tx.id} transaction={tx}
                  childName={name(tx.memberId)} childAvatar={avatar(tx.memberId)}
                  onApprove={handleApproveTx} onDeny={handleDenyTx}
                  loading={actionLoading === tx.id}
                />
              ))}
            </View>
          )}
          {pendingCCs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Chore Completions</Text>
              {pendingCCs.map((cc) => (
                <ChoreActionCard
                  key={cc.id} completion={cc}
                  childName={name(cc.memberId)} childAvatar={avatar(cc.memberId)}
                  onApprove={handleApproveCC} onDeny={handleDenyCC}
                  loading={actionLoading === cc.id}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.h2 },
  badge: { backgroundColor: Colors.actionOrange, borderRadius: 99, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  section: { gap: Spacing.xs },
  sectionLabel: { ...Typography.h4, color: Colors.textSecondary },
  allClear: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  allClearIcon: { fontSize: 56 },
  allClearTitle: { ...Typography.h2, color: Colors.approved },
  allClearDesc: { ...Typography.bodyLarge, color: Colors.textMuted },
});
