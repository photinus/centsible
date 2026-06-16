import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  color?: string;
}

export function Card({ children, style, padding = Spacing.md, color }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding, backgroundColor: color ?? Colors.cardBackground },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    ...Shadows.md,
  },
});
