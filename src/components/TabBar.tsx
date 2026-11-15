import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTab } from '@/types';
import { colors, layout, pressed, radius, type } from '@/theme';

const TABS: { id: AppTab; label: string }[] = [
  { id: 'tuner', label: 'Tune' },
  { id: 'player', label: 'Player' },
  { id: 'library', label: 'Library' },
];

export function TabBar({ activeTab, onChange }: { activeTab: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {TABS.map(({ id, label }) => {
        const active = activeTab === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(id)}
            style={({ pressed: isPressed }) => [styles.tab, isPressed && pressed]}
          >
            <Text numberOfLines={1} style={[type.label, styles.label, active && styles.activeLabel]}>
              {label}
            </Text>
            <View style={[styles.underline, active && styles.activeUnderline]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: layout.tabBarHeight,
    flexDirection: 'row',
    backgroundColor: colors.ground,
    borderTopWidth: 1,
    borderColor: colors.rule,
    paddingHorizontal: layout.screenPadding,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { color: colors.faint },
  activeLabel: { color: colors.ink },
  underline: { width: 20, height: 2, borderRadius: radius.bar, backgroundColor: 'transparent' },
  activeUnderline: { backgroundColor: colors.accent },
});
