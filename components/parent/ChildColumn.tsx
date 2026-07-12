import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SparkLine } from '../shared/SparkLine';
import { AccountCard } from '../kid/AccountCard';
import { GoalCard } from '../kid/GoalCard';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import type { Member, Goal, Transaction } from '../../types';

interface ChildColumnProps {
  member: Member;
  goals: Goal[];
  recentTransactions: Transaction[];
  onEditGoal: (goal: Goal) => void;
  onViewTransactions?: (member: Member) => void;
}

export function ChildColumn({ member, goals, recentTransactions, onEditGoal, onViewTransactions }: ChildColumnProps) {
  const total =
    (member.accounts.spend ?? 0) +
    (member.accounts.save ?? 0) +
    (member.accounts.give ?? 0);

  // Build simple history from approved transactions (cumulative)
  const history = buildCumulativeHistory(recentTransactions, total);

  return (
    <View style={styles.column}>
      {/* Child header */}
      <View style={styles.header}>
        <Text style={styles.avatar}>{member.avatarEmoji}</Text>
        <View>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.total}>${total.toFixed(2)}</Text>
        </View>
        {history.length >= 2 && (
          <SparkLine data={history} width={80} height={40} color={Colors.growthGreen} showFill />
        )}
      </View>

      {/* Toggle Month/Year (cosmetic) */}
      <View style={styles.toggleRow}>
        {['Month', 'Year'].map((label, i) => (
          <TouchableOpacity key={label} style={[styles.toggleBtn, i === 1 && styles.toggleBtnActive]}>
            <Text style={[styles.toggleText, i === 1 && styles.toggleTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Accounts row */}
      <View style={styles.accountsRow}>
        <AccountCard type="spend" balance={member.accounts.spend ?? 0} compact />
        <AccountCard type="save" balance={member.accounts.save ?? 0} compact />
        <AccountCard type="give" balance={member.accounts.give ?? 0} compact />
      </View>

      {/* Goals */}
      {goals.filter((g) => g.isActive).map((goal) => (
        <GoalCard key={goal.id} goal={goal} onEdit={onEditGoal} compact />
      ))}

      {/* Transactions link */}
      {onViewTransactions && (
        <TouchableOpacity style={styles.txLink} onPress={() => onViewTransactions(member)} activeOpacity={0.7}>
          <Text style={styles.txLinkText}>View Transactions →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function buildCumulativeHistory(transactions: Transaction[], currentTotal: number): number[] {
  if (!transactions.length) return [];
  // Walk backwards from current total to reconstruct history
  let running = currentTotal;
  const points: number[] = [running];
  const sorted = [...transactions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  for (const tx of sorted.slice(0, 11)) {
    const isDebit = tx.type === 'withdrawal' || tx.type === 'goal_contribution';
    running = isDebit ? running + tx.amount : running - tx.amount;
    points.unshift(Math.max(0, running));
  }
  return points;
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    fontSize: 36,
  },
  name: {
    ...Typography.h3,
  },
  total: {
    ...Typography.amountMd,
    color: Colors.growthGreen,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.appBackground,
    borderRadius: Radius.lg,
    padding: 3,
    alignSelf: 'flex-start',
    gap: 3,
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  toggleBtnActive: {
    backgroundColor: Colors.growthGreen,
  },
  toggleText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  accountsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  txLink: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  txLinkText: {
    ...Typography.body,
    color: Colors.secureBlue,
    fontWeight: '600',
  },
});
