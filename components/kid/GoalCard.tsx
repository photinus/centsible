import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import type { Goal } from '../../types';

interface GoalCardProps {
  goal: Goal;
  onContribute?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  compact?: boolean;
}

export function GoalCard({ goal, onContribute, onEdit, compact = false }: GoalCardProps) {
  const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
  const progressPercent = Math.round(progress * 100);
  const isCompleted = goal.completedAt != null || !goal.isActive;
  const remaining = goal.targetAmount - goal.currentAmount;

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Text style={styles.compactIcon}>{goal.iconEmoji}</Text>
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>{goal.title}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` as any }]} />
          </View>
        </View>
        {onEdit && (
          <TouchableOpacity onPress={() => onEdit(goal)}>
            <Text style={styles.editLabel}>Edit Goal</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{goal.iconEmoji}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>{goal.title}</Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>🎉 Completed!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Amounts */}
      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.amountLabel}>Saved</Text>
          <Text style={styles.amountValue}>${goal.currentAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.amountDivider} />
        <View>
          <Text style={styles.amountLabel}>Goal</Text>
          <Text style={styles.amountValue}>${goal.targetAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.amountDivider} />
        <View>
          <Text style={styles.amountLabel}>Left</Text>
          <Text style={[styles.amountValue, { color: Colors.actionOrange }]}>
            ${Math.max(0, remaining).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>{progressPercent}% there!</Text>

      {/* Action */}
      {!isCompleted && onContribute && (
        <TouchableOpacity style={styles.contributeBtn} onPress={() => onContribute(goal)}>
          <Text style={styles.contributeBtnText}>💰 Add Money</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  cardCompleted: {
    borderWidth: 2,
    borderColor: Colors.growthGreen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 40,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.h3,
  },
  completedBadge: {
    backgroundColor: Colors.approvedBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  completedBadgeText: {
    color: Colors.approved,
    fontWeight: '600',
    fontSize: 12,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  amountLabel: {
    ...Typography.bodySmall,
    marginBottom: 2,
  },
  amountValue: {
    ...Typography.amountSm,
    color: Colors.textPrimary,
  },
  amountDivider: {
    flex: 1,
  },
  progressBg: {
    height: 10,
    backgroundColor: Colors.appBackground,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.growthGreen,
    borderRadius: Radius.full,
  },
  progressLabel: {
    ...Typography.bodySmall,
    color: Colors.growthGreen,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  contributeBtn: {
    backgroundColor: Colors.saveBg,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  contributeBtnText: {
    color: Colors.saveText,
    fontWeight: '700',
    fontSize: 15,
  },
  // Compact (parent view)
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  compactIcon: {
    fontSize: 24,
  },
  compactInfo: {
    flex: 1,
    gap: 4,
  },
  compactTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  editLabel: {
    ...Typography.bodySmall,
    color: Colors.secureBlue,
    fontWeight: '600',
  },
});
