import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import type { Chore, ChoreCompletion } from '../../types';

interface ChoreCardProps {
  chore: Chore;
  pendingCompletion?: ChoreCompletion;
  onComplete: (chore: Chore) => void;
  disabled?: boolean;
}

export function ChoreCard({ chore, pendingCompletion, onComplete, disabled }: ChoreCardProps) {
  const isPending = pendingCompletion?.status === 'pending';

  return (
    <View style={[styles.card, isPending && styles.cardPending]}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{chore.iconEmoji}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{chore.title}</Text>
          {chore.description ? (
            <Text style={styles.desc} numberOfLines={1}>{chore.description}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.value}>${chore.value.toFixed(2)}</Text>
        {isPending ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.completeBtn, disabled && styles.completeBtnDisabled]}
            onPress={() => onComplete(chore)}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.completeBtnText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  cardPending: {
    opacity: 0.75,
    borderWidth: 1,
    borderColor: Colors.pending,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.appBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  desc: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  value: {
    ...Typography.amountSm,
    color: Colors.growthGreen,
  },
  completeBtn: {
    backgroundColor: Colors.growthGreen,
    borderRadius: Radius.md,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  completeBtnDisabled: {
    opacity: 0.5,
  },
  completeBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  pendingBadge: {
    backgroundColor: Colors.pendingBg,
    borderRadius: Radius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pendingText: {
    color: Colors.pending,
    fontWeight: '600',
    fontSize: 12,
  },
});
