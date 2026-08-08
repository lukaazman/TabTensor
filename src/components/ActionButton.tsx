import React, { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, layout, type } from '@/theme';

type Props = PropsWithChildren<{
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}>;

export function ActionButton({ children, onPress, variant = 'secondary', disabled, loading, style, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.black : colors.white} /> : <Text style={[styles.label, variant === 'primary' && styles.primaryLabel]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.controlHeight,
    paddingHorizontal: 16,
    borderRadius: layout.radius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.red, borderColor: colors.red },
  secondary: { backgroundColor: colors.panelRaised, borderColor: colors.borderStrong },
  quiet: { backgroundColor: 'transparent', borderColor: colors.border },
  danger: { backgroundColor: colors.redDim, borderColor: colors.red },
  label: { ...type.body, fontWeight: '700' },
  primaryLabel: { color: colors.black },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.42 },
});
