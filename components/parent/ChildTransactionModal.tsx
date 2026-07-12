import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import { ActivityItem } from '../kid/ActivityItem';
import { getAllTransactionsByMember } from '../../services/firestore';
import type { Member, Transaction, AccountType } from '../../types';
import { subDays, startOfDay } from 'date-fns';

type AccountFilter = 'all' | AccountType;
type DateRange = '7d' | '30d' | '90d' | 'all';

const ACCOUNT_FILTERS: { key: AccountFilter; label: string; color: string }[] = [
  { key: 'all',   label: 'All Accounts', color: Colors.textPrimary },
  { key: 'spend', label: 'Spend',        color: Colors.spendAccent },
  { key: 'save',  label: 'Save',         color: Colors.saveAccent  },
  { key: 'give',  label: 'Give',         color: Colors.giveAccent  },
];

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: '7d',  label: '7 Days'  },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
];

interface Props {
  member: Member | null;
  visible: boolean;
  onClose: () => void;
}

export function ChildTransactionModal({ member, visible, onClose }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  useEffect(() => {
    if (visible && member) {
      loadTransactions();
    } else {
      setTransactions([]);
      setAccountFilter('all');
      setDateRange('30d');
    }
  }, [visible, member?.id]);

  async function loadTransactions() {
    if (!member) return;
    setLoading(true);
    try {
      const txs = await getAllTransactionsByMember(member.id);
      setTransactions(txs);
    } finally {
      setLoading(false);
    }
  }

  const filtered = transactions.filter((tx) => {
    if (accountFilter !== 'all' && tx.account !== accountFilter) return false;
    if (dateRange !== 'all') {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoff = startOfDay(subDays(new Date(), days));
      if (tx.createdAt < cutoff) return false;
    }
    return true;
  });

  const approved = filtered.filter((t) => t.status === 'approved');
  const pending  = filtered.filter((t) => t.status === 'pending');

  // Net total for filtered approved transactions
  const netTotal = approved.reduce((sum, tx) => {
    const isDebit = tx.type === 'withdrawal' || tx.type === 'goal_contribution' || !!tx.isDebit;
    return sum + (isDebit ? -tx.amount : tx.amount);
  }, 0);

  if (!member) return null;

  const total = (member.accounts.spend ?? 0) + (member.accounts.save ?? 0) + (member.accounts.give ?? 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.avatar}>{member.avatarEmoji}</Text>
              <View>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.balance}>${total.toFixed(2)} total balance</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Account filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
            {ACCOUNT_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, accountFilter === f.key && { backgroundColor: f.color, borderColor: f.color }]}
                onPress={() => setAccountFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, accountFilter === f.key && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date range filter */}
          <View style={styles.filterRow}>
            {DATE_RANGES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.dateChip, dateRange === r.key && styles.dateChipActive]}
                onPress={() => setDateRange(r.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateChipText, dateRange === r.key && styles.dateChipTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Summary bar */}
          <View style={styles.summaryBar}>
            <Text style={styles.summaryCount}>{approved.length} transaction{approved.length !== 1 ? 's' : ''}</Text>
            <Text style={[styles.summaryNet, { color: netTotal >= 0 ? Colors.approved : Colors.denied }]}>
              {netTotal >= 0 ? '+' : ''}${netTotal.toFixed(2)} net
            </Text>
          </View>

          {/* Transaction list */}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator color={Colors.growthGreen} style={{ paddingVertical: 40 }} />
            ) : (
              <>
                {pending.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pending Approval</Text>
                    {pending.map((tx) => (
                      <View key={tx.id} style={styles.pendingWrap}>
                        <ActivityItem transaction={tx} />
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>⏱ Pending</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.section}>
                  {approved.length > 0 && pending.length > 0 && (
                    <Text style={styles.sectionTitle}>History</Text>
                  )}
                  {approved.length === 0 && pending.length === 0 ? (
                    <Text style={styles.empty}>No transactions match these filters.</Text>
                  ) : (
                    approved.map((tx) => <ActivityItem key={tx.id} transaction={tx} />)
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    ...Shadows.lg,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { fontSize: 36 },
  name: { ...Typography.h3 },
  balance: { ...Typography.bodySmall, color: Colors.textMuted },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.appBackground,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  filterScroll: { flexGrow: 0 },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  chip: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.appBackground,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },

  dateChip: {
    flex: 1, paddingVertical: 6, alignItems: 'center',
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.appBackground,
  },
  dateChipActive: { backgroundColor: Colors.secureBlue, borderColor: Colors.secureBlue },
  dateChipText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  dateChipTextActive: { color: Colors.white },

  summaryBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.appBackground, borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },
  summaryCount: { ...Typography.bodySmall, fontWeight: '600', color: Colors.textSecondary },
  summaryNet: { ...Typography.h4 },

  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.xs },
  section: { gap: Spacing.xs },
  sectionTitle: { ...Typography.label, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  empty: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  pendingWrap: { position: 'relative' },
  pendingBadge: {
    position: 'absolute', right: 0, top: Spacing.sm,
    backgroundColor: Colors.pendingBg, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  pendingBadgeText: { color: Colors.pending, fontSize: 11, fontWeight: '600' },
});
