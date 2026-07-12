import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import type { Transaction } from '../../types';
import { format } from 'date-fns';

const TYPE_CONFIG: Record<string, { emoji: string; bgColor: string }> = {
  deposit: { emoji: '💰', bgColor: Colors.approvedBg },
  withdrawal: { emoji: '🛒', bgColor: Colors.deniedBg },
  chore_reward: { emoji: '✅', bgColor: Colors.approvedBg },
  interest: { emoji: '📈', bgColor: Colors.spendBg },
  allowance: { emoji: '🎁', bgColor: Colors.saveBg },
  goal_contribution: { emoji: '🎯', bgColor: Colors.saveBg },
  parent_adjustment: { emoji: '⚙️', bgColor: Colors.pendingBg },
};

interface ActivityItemProps {
  transaction: Transaction;
}

export function ActivityItem({ transaction: tx }: ActivityItemProps) {
  const cfg = TYPE_CONFIG[tx.type] ?? { emoji: '💵', bgColor: Colors.appBackground };
  const isDebit = tx.type === 'withdrawal' || tx.type === 'goal_contribution' || !!tx.isDebit;
  const amountColor = isDebit ? Colors.denied : Colors.approved;
  const sign = isDebit ? '-' : '+';

  return (
    <View style={styles.row}>
      <View style={[styles.iconBg, { backgroundColor: cfg.bgColor }]}>
        <Text style={styles.icon}>{cfg.emoji}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>{tx.description}</Text>
        <Text style={styles.date}>{format(tx.createdAt, 'MMM d, yyyy')}</Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {sign}${tx.amount.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  details: {
    flex: 1,
  },
  description: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  date: {
    ...Typography.bodySmall,
  },
  amount: {
    ...Typography.h4,
    fontWeight: '700',
  },
});
