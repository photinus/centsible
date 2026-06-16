import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SparkLine } from '../shared/SparkLine';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../constants/theme';

interface TotalStashCardProps {
  name: string;
  total: number;
  history?: number[];
  onDeposit: () => void;
  onWithdraw: () => void;
}

export function TotalStashCard({
  name,
  total,
  history,
  onDeposit,
  onWithdraw,
}: TotalStashCardProps) {
  const greeting = getGreeting();

  return (
    <View style={styles.card}>
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.name}>{name}!</Text>
      </View>

      {/* Balance */}
      <Text style={styles.stashLabel}>Total Stash</Text>
      <Text style={styles.balance}>${total.toFixed(2)}</Text>

      {/* Trend line */}
      {history && history.length >= 2 && (
        <View style={styles.chartWrap}>
          <SparkLine
            data={history}
            width={160}
            height={36}
            color={Colors.white}
            showFill
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.depositBtn]} onPress={onDeposit} activeOpacity={0.85}>
          <Text style={styles.btnText}>💰 Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.withdrawBtn]} onPress={onWithdraw} activeOpacity={0.85}>
          <Text style={styles.btnText}>🛒 Withdraw</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.stashGradientStart,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  greeting: {
    ...Typography.h4,
    color: 'rgba(255,255,255,0.85)',
  },
  name: {
    ...Typography.h2,
    color: Colors.white,
  },
  stashLabel: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  balance: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 52,
  },
  chartWrap: {
    marginTop: Spacing.xs,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  btn: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  depositBtn: {
    backgroundColor: Colors.growthGreen,
  },
  withdrawBtn: {
    backgroundColor: Colors.actionOrange,
  },
  btnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
