import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import type { Transaction, ChoreCompletion } from '../../types';
import { format } from 'date-fns';

// ─── Transaction approval card ───────────────────────────────────────────────

interface TransactionActionCardProps {
  transaction: Transaction;
  childName: string;
  childAvatar: string;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  loading?: boolean;
}

export function TransactionActionCard({
  transaction: tx,
  childName,
  childAvatar,
  onApprove,
  onDeny,
  loading,
}: TransactionActionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.avatar}>{childAvatar}</Text>
        <View style={styles.info}>
          <Text style={styles.title}>
            <Text style={styles.bold}>{childName}</Text>
            {' '}requesting{' '}
            <Text style={styles.bold}>{tx.type === 'withdrawal' ? 'withdrawal' : 'deposit'}</Text>
          </Text>
          <Text style={styles.desc}>{tx.description}</Text>
          <Text style={styles.meta}>
            ${tx.amount.toFixed(2)} · {tx.account} · {format(tx.createdAt, 'MMM d')}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Pending</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.approveBtn, loading && styles.btnLoading]}
          onPress={() => onApprove(tx.id)}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.approveBtnText}>✓ Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.denyBtn, loading && styles.btnLoading]}
          onPress={() => onDeny(tx.id)}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.denyBtnText}>✕ Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Chore completion approval card ──────────────────────────────────────────

interface ChoreActionCardProps {
  completion: ChoreCompletion;
  childName: string;
  childAvatar: string;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  loading?: boolean;
}

export function ChoreActionCard({
  completion,
  childName,
  childAvatar,
  onApprove,
  onDeny,
  loading,
}: ChoreActionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.avatar}>{childAvatar}</Text>
        <View style={styles.info}>
          <Text style={styles.title}>
            <Text style={styles.bold}>{childName}</Text>
            {' '}submitted{' '}
            <Text style={styles.bold}>"{completion.choreName}"</Text>
          </Text>
          <Text style={styles.desc}>Review work before approving reward</Text>
          <Text style={styles.meta}>
            ${completion.choreValue.toFixed(2)} reward · {format(completion.submittedAt, 'MMM d')}
          </Text>
        </View>
        <Text style={styles.choreEmoji}>✅</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.approveBtn, loading && styles.btnLoading]}
          onPress={() => onApprove(completion.id)}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.approveBtnText}>✓ Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.denyBtn, loading && styles.btnLoading]}
          onPress={() => onDeny(completion.id)}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.denyBtnText}>✕ Deny</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  avatar: {
    fontSize: 32,
    marginTop: 2,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  desc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  meta: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: Colors.pendingBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: Colors.pending,
    fontWeight: '600',
    fontSize: 11,
  },
  choreEmoji: {
    fontSize: 28,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: Colors.growthGreen,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  denyBtn: {
    flex: 1,
    backgroundColor: Colors.deniedBg,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.denied,
  },
  denyBtnText: {
    color: Colors.denied,
    fontWeight: '700',
    fontSize: 14,
  },
  btnLoading: {
    opacity: 0.5,
  },
});
