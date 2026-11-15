import React, { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, layout, pressed, radius, type } from '@/theme';

type Props = PropsWithChildren<{
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}>;

// Same shape as the FullScanSecurity buttons: 12 radius, filled accent primary, outlined secondary.
export function ActionButton({
  children,
  onPress,
  variant = 'secondary',
  disabled,
  loading,
  style,
  accessibilityLabel,
}: Props) {
  const inactive = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed: isPressed }) => [
        styles.base,
        styles[variant],
        isPressed && pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onAccent : colors.ink} />
      ) : (
        <Text
          numberOfLines={1}
          style={[type.label, variant === 'primary' && styles.primaryLabel, variant === 'danger' && styles.dangerLabel]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.controlHeight,
    paddingHorizontal: 16,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: 'transparent', borderColor: colors.control },
  quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  danger: { backgroundColor: colors.accentTint, borderColor: colors.accentTint },
  primaryLabel: { color: colors.onAccent },
  dangerLabel: { color: colors.accent },
  disabled: { opacity: 0.45 },
});
