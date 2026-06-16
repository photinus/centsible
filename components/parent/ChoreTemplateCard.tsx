import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';
import type { Chore } from '../../types';

interface ChoreTemplateCardProps {
  chore: Chore;
  onEdit: (chore: Chore) => void;
  onDelete: (chore: Chore) => void;
}

const FREQ_LABELS: Record<Chore['frequency'], string> = {
  once: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function ChoreTemplateCard({ chore, onEdit, onDelete }: ChoreTemplateCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{chore.iconEmoji}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{chore.title}</Text>
          <View style={styles.meta}>
            <View style={styles.freqBadge}>
              <Text style={styles.freqText}>{FREQ_LABELS[chore.frequency]}</Text>
            </View>
            <Text style={styles.assigned}>
              {chore.assignedTo === 'general'
                ? '👥 All kids'
                : `👤 ${Array.isArray(chore.assignedTo) ? chore.assignedTo.length : 1} kid(s)`}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.value}>${chore.value.toFixed(2)}</Text>
        <View style={styles.actionBtns}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(chore)} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(chore)} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>🗑</Text>
          </TouchableOpacity>
        </View>
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
    gap: 4,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  freqBadge: {
    backgroundColor: Colors.appBackground,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freqText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  assigned: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  value: {
    ...Typography.amountSm,
    color: Colors.growthGreen,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  editBtn: {
    backgroundColor: Colors.secureBlue,
    borderRadius: Radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  editBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: Colors.deniedBg,
    borderRadius: Radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    fontSize: 14,
  },
});
