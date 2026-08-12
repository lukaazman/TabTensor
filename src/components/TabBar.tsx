import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AppTab } from '@/types';
import { colors, layout, type } from '@/theme';

export function TabBar({ activeTab, onChange }: { activeTab: AppTab; onChange: (tab: AppTab) => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 340;

  return (
    <View style={styles.bar}>
      <View style={styles.barInner}>
        <Tab compact={compact} label="TUNER" hint="01" active={activeTab === 'tuner'} onPress={() => onChange('tuner')} />
        <Tab compact={compact} label="PLAYER" hint="02" active={activeTab === 'player'} onPress={() => onChange('player')} />
      </View>
    </View>
  );
}

function Tab({ label, hint, active, compact, onPress }: { label: string; hint: string; active: boolean; compact: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={`${hint} ${label}`} accessibilityState={{ selected: active }} onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.tab, compact && styles.tabCompact, active && styles.activeTab, pressed && styles.pressed]}>
      <View style={[styles.tabMarker, active && styles.activeMarker]} />
      <View style={[styles.tabCopy, compact && styles.tabCopyCompact]}>
        <Text style={[styles.hint, active && styles.activeText]}>{hint}</Text>
        <Text numberOfLines={1} style={[type.section, compact && styles.compactLabel, active && styles.activeText]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { height: layout.tabBarHeight, backgroundColor: colors.paperRaised, borderTopWidth: 1, borderColor: colors.rule, paddingHorizontal: layout.screenPadding, paddingTop: 10, paddingBottom: 12 },
  barInner: { flex: 1, flexDirection: 'row', gap: 10 },
  tab: { flex: 1, minHeight: 56, paddingHorizontal: 14, borderWidth: 1, borderColor: 'transparent', borderRadius: layout.radiusControl, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tabCompact: { flexBasis: 0, minWidth: 0, paddingHorizontal: 8, gap: 6 },
  activeTab: { backgroundColor: colors.paperSoft, borderColor: colors.ruleStrong },
  tabMarker: { width: 6, height: 30, borderRadius: 3, backgroundColor: colors.rule },
  activeMarker: { backgroundColor: colors.accent },
  tabCopy: { gap: 4 },
  tabCopyCompact: { flex: 1, minWidth: 0, flexShrink: 1, gap: 2 },
  hint: { ...type.mono, color: colors.neutral, fontSize: 10 },
  compactLabel: { fontSize: 12, letterSpacing: 0.8 },
  activeText: { color: colors.accentBright },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
