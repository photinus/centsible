import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Shadows } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'orange';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.growthGreen, text: Colors.white },
  secondary: { bg: Colors.appBackground, text: Colors.textPrimary, border: Colors.border },
  danger: { bg: Colors.denied, text: Colors.white },
  ghost: { bg: 'transparent', text: Colors.growthGreen, border: Colors.growthGreen },
  orange: { bg: Colors.actionOrange, text: Colors.white },
};

const SIZE_STYLES = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13, borderRadius: Radius.sm },
  md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 15, borderRadius: Radius.md },
  lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 16, borderRadius: Radius.lg },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const vs = VARIANT_STYLES[variant];
  const ss = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          paddingVertical: ss.paddingVertical,
          paddingHorizontal: ss.paddingHorizontal,
          borderRadius: ss.borderRadius,
          borderWidth: vs.border ? 1.5 : 0,
          borderColor: vs.border,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        Shadows.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: vs.text, fontSize: ss.fontSize },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
