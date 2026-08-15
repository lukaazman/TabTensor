/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
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
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.accentInk : colors.ink} /> : <Text numberOfLines={1} style={[styles.label, variant === 'primary' && styles.primaryLabel, variant === 'quiet' && styles.quietLabel]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.controlHeight,
    paddingHorizontal: 16,
    borderRadius: layout.radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: colors.paperRaised, borderColor: colors.ruleStrong },
  quiet: { backgroundColor: 'transparent', borderColor: colors.rule },
  danger: { backgroundColor: colors.accentWash, borderColor: colors.accent },
  label: { ...type.body, color: colors.ink, fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
  primaryLabel: { color: colors.accentInk },
  quietLabel: { color: colors.inkMuted },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
