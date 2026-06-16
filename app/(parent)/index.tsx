import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../hooks/useAuth';
import { useDataStore } from '../../store/dataStore';
import { TransactionActionCard, ChoreActionCard } from '../../components/parent/ActionCard';
import { SparkLine } from '../../components/shared/SparkLine';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import {
  approveTransaction,
  denyTransaction,
  approveChoreCompletion,
  denyChoreCompletion,
  getPendingTransactionsByHousehold,
} from '../../services/firestore';
import { enqueueAction, isOnline } from '../../services/offline';

export default function ParentDashboard() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { refresh } = useHousehold();
  const { allMembers, pendingApprovalCount } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [pendingTxs, setPendingTxs] = useState<import('../../types').Transaction[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<import('../../types').ChoreCompletion[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load pending items on mount
  React.useEffect(() => {
    if (session && !initialized) loadPending();
  }, [session]);

  async function loadPending() {
    if (!session) return;
    try {
      // Get transactions + completions from Firestore listener via store
      // For this screen we do a direct fetch for the full list
      const txs = await getPendingTransactionsByHousehold(session.householdId);
      setPendingTxs(txs);

      const { query, collection, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase');
      const ccQ = query(
        collection(db, 'choreCompletions'),
        where('householdId', '==', session.householdId),
        where('status', '==', 'pending')
      );
      const ccSnap = await getDocs(ccQ);
      const completions = ccSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          householdId: data.householdId,
          choreId: data.choreId,
          choreName: data.choreName,
          choreValue: data.choreValue,
          memberId: data.memberId,
          status: data.status,
          submittedAt: data.submittedAt?.toDate?.() ?? new Date(),
          reviewedAt: data.reviewedAt?.toDate?.(),
          reviewedBy: data.reviewedBy,
          notes: data.notes,
        } as import('../../types').ChoreCompletion;
      });
      setPendingCompletions(completions);
      setInitialized(true);
    } catch (e) {
      console.warn('loadPending error', e);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    await loadPending();
    setRefreshing(false);
  }

  async function handleApproveTx(txId: string) {
    if (!session) return;
    setActionLoading(txId);
    try {
      const online = await isOnline();
      if (online) {
        await approveTransaction(txId, session.memberId);
      } else {
        await enqueueAction('approve_transaction', { transactionId: txId, approverId: session.memberId });
      }
      setPendingTxs((prev) => prev.filter((t) => t.id !== txId));
    } catch {
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDenyTx(txId: string) {
    if (!session) return;
    setActionLoading(txId);
    try {
      await denyTransaction(txId, session.memberId);
      setPendingTxs((prev) => prev.filter((t) => t.id !== txId));
    } catch {
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveChore(completionId: string) {
    if (!session) return;
    setActionLoading(completionId);
    try {
      const online = await isOnline();
      if (online) {
        await approveChoreCompletion(completionId, session.memberId);
      } else {
        await enqueueAction('approve_chore', { completionId, approverId: session.memberId });
      }
      setPendingCompletions((prev) => prev.filter((c) => c.id !== completionId));
    } catch {
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDenyChore(completionId: string) {
    if (!session) return;
    setActionLoading(completionId);
    try {
      await denyChoreCompletion(completionId, session.memberId);
      setPendingCompletions((prev) => prev.filter((c) => c.id !== completionId));
    } catch {
    } finally {
      setActionLoading(null);
    }
  }

  function getMemberName(memberId: string) {
    return allMembers.find((m) => m.id === memberId)?.name ?? 'Child';
  }
  function getMemberAvatar(memberId: string) {
    return allMembers.find((m) => m.id === memberId)?.avatarEmoji ?? '🧒';
  }

  const totalItems = pendingTxs.length + pendingCompletions.length;
  const greeting = getGreeting();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.growthGreen} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Parent Command Center</Text>
          <Text style={styles.headerSubtitle}>{greeting}, {session?.name ?? 'Parent'}!</Text>
        </View>
        <SparkLine data={[100, 120, 115, 140, 135, 160, 180]} width={80} height={40} color={Colors.growthGreen} showFill />
      </View>

      {/* Actions Required */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actions Required</Text>
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </View>

        {totalItems === 0 ? (
          <View style={styles.allClearCard}>
            <Text style={styles.allClearIcon}>🎉</Text>
            <Text style={styles.allClearTitle}>All caught up!</Text>
            <Text style={styles.allClearDesc}>No pending approvals right now.</Text>
          </View>
        ) : (
          <>
            {pendingTxs.map((tx) => (
              <TransactionActionCard
                key={tx.id}
                transaction={tx}
                childName={getMemberName(tx.memberId)}
                childAvatar={getMemberAvatar(tx.memberId)}
                onApprove={handleApproveTx}
                onDeny={handleDenyTx}
                loading={actionLoading === tx.id}
              />
            ))}
            {pendingCompletions.map((cc) => (
              <ChoreActionCard
                key={cc.id}
                completion={cc}
                childName={getMemberName(cc.memberId)}
                childAvatar={getMemberAvatar(cc.memberId)}
                onApprove={handleApproveChore}
                onDeny={handleDenyChore}
                loading={actionLoading === cc.id}
              />
            ))}
          </>
        )}
      </View>

      {/* Family summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family Summary</Text>
        <View style={styles.summaryCards}>
          {allMembers.filter((m) => m.role === 'kid').map((kid) => {
            const total = (kid.accounts.spend ?? 0) + (kid.accounts.save ?? 0) + (kid.accounts.give ?? 0);
            return (
              <View key={kid.id} style={styles.summaryCard}>
                <Text style={styles.summaryAvatar}>{kid.avatarEmoji}</Text>
                <Text style={styles.summaryName}>{kid.name}</Text>
                <Text style={styles.summaryTotal}>${total.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.appBackground },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { ...Typography.bodySmall, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerSubtitle: { ...Typography.h2 },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { ...Typography.h3 },
  badge: {
    backgroundColor: Colors.actionOrange, borderRadius: 99,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  allClearCard: {
    backgroundColor: Colors.approvedBg, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
  },
  allClearIcon: { fontSize: 40 },
  allClearTitle: { ...Typography.h3, color: Colors.approved },
  allClearDesc: { ...Typography.body, color: Colors.approved },
  summaryCards: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  summaryCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
    minWidth: 100, ...Shadows.sm,
  },
  summaryAvatar: { fontSize: 32 },
  summaryName: { ...Typography.h4 },
  summaryTotal: { ...Typography.amountSm, color: Colors.growthGreen },
});
