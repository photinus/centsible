import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SparkLine } from '../shared/SparkLine';
import { Colors, Radius, Spacing, Typography, Shadows } from '../../constants/theme';
import type { AccountType } from '../../types';

const ACCOUNT_CONFIG: Record<AccountType, {
  label: string;
  emoji: string;
  bg: string;
  accent: string;
  textColor: string;
  chartColor: string;
}> = {
  spend: {
    label: 'Spend',
    emoji: '🛍️',
    bg: Colors.spendBg,
    accent: Colors.spendAccent,
    textColor: Colors.spendText,
    chartColor: Colors.spendAccent,
  },
  save: {
    label: 'Save',
    emoji: '🐷',
    bg: Colors.saveBg,
    accent: Colors.saveAccent,
    textColor: Colors.saveText,
    chartColor: Colors.saveAccent,
  },
  give: {
    label: 'Give',
    emoji: '❤️',
    bg: Colors.giveBg,
    accent: Colors.giveAccent,
    textColor: Colors.giveText,
    chartColor: Colors.giveAccent,
  },
};

interface AccountCardProps {
  type: AccountType;
  balance: number;
  history?: number[];
  compact?: boolean;
}

export function AccountCard({ type, balance, history, compact = false }: AccountCardProps) {
  const cfg = ACCOUNT_CONFIG[type];
  const sparkData = history && history.length >= 2 ? history : undefined;

  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: cfg.bg }]}>
        <Text style={styles.compactEmoji}>{cfg.emoji}</Text>
        <Text style={[styles.compactLabel, { color: cfg.textColor }]}>{cfg.label}</Text>
        <Text style={[styles.compactAmount, { color: cfg.accent }]}>
          ${balance.toFixed(2)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: cfg.bg }]}>
      <View style={styles.row}>
        <View>
          <Text style={styles.emoji}>{cfg.emoji}</Text>
          <Text style={[styles.label, { color: cfg.textColor }]}>{cfg.label} Account</Text>
          <Text style={[styles.amount, { color: cfg.accent }]}>${balance.toFixed(2)}</Text>
        </View>
        {sparkData && (
          <SparkLine
            data={sparkData}
            width={80}
            height={44}
            color={cfg.chartColor}
            showFill
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flex: 1,
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  emoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    ...Typography.amountSm,
  },
  // Compact (phone home screen)
  compact: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    flex: 1,
    ...Shadows.sm,
  },
  compactEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  compactLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
});
