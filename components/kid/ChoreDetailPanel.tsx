/**
 * Tablet master-detail: right-side panel showing chore details + submit button
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import type { Chore } from '../../types';

interface ChoreDetailPanelProps {
  chore: Chore | null;
  onComplete: (chore: Chore) => void;
  loading?: boolean;
  isPending?: boolean;
}

export function ChoreDetailPanel({ chore, onComplete, loading, isPending }: ChoreDetailPanelProps) {
  if (!chore) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🤖</Text>
        <Text style={styles.emptyText}>Select a chore to see details</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Large icon */}
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{chore.iconEmoji}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{chore.title}</Text>

      {/* Description / instructions */}
      {chore.description ? (
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsLabel}>Instructions</Text>
          <Text style={styles.instructions}>{chore.description}</Text>
        </View>
      ) : null}

      {/* Value */}
      <View style={styles.valueRow}>
        <Text style={styles.valueLabel}>Reward</Text>
        <Text style={styles.value}>${chore.value.toFixed(2)}</Text>
      </View>

      {/* Frequency badge */}
      <View style={styles.freqBadge}>
        <Text style={styles.freqText}>🔁 {chore.frequency.charAt(0).toUpperCase() + chore.frequency.slice(1)}</Text>
      </View>

      {/* Submit */}
      {isPending ? (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingText}>⏱ Waiting for parent approval…</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnLoading]}
          onPress={() => onComplete(chore)}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Submitting…' : '✅ Complete and Submit'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  content: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: Radius.xl,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  icon: {
    fontSize: 52,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignSelf: 'stretch',
    ...Shadows.sm,
  },
  instructionsLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  instructions: {
    ...Typography.bodyLarge,
    lineHeight: 24,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.saveBg,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  valueLabel: {
    ...Typography.h4,
    color: Colors.saveText,
  },
  value: {
    ...Typography.amount,
    color: Colors.saveAccent,
  },
  freqBadge: {
    backgroundColor: Colors.appBackground,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freqText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: Colors.growthGreen,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
    alignSelf: 'stretch',
    alignItems: 'center',
    ...Shadows.md,
  },
  submitBtnLoading: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  pendingBanner: {
    backgroundColor: Colors.pendingBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  pendingText: {
    color: Colors.pending,
    fontWeight: '600',
    fontSize: 15,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.h4,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
