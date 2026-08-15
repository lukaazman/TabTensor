/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTab } from '@/types';
import { colors, layout, type } from '@/theme';

export function TabBar({ activeTab, onChange }: { activeTab: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <View style={styles.bar}>
      <View style={styles.barInner}>
        <Tab label="Tune" active={activeTab === 'tuner'} onPress={() => onChange('tuner')} />
        <Tab label="Player" active={activeTab === 'player'} onPress={() => onChange('player')} />
        <Tab label="Library" active={activeTab === 'library'} onPress={() => onChange('library')} />
      </View>
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.tab, active && styles.activeTab, pressed && styles.pressed]}>
      <View style={[styles.tabMarker, active && styles.activeMarker]} />
      <Text numberOfLines={1} style={[type.body, styles.label, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { height: layout.tabBarHeight, backgroundColor: colors.paper, borderTopWidth: 1, borderColor: colors.rule, paddingHorizontal: layout.screenPadding, paddingTop: 8, paddingBottom: 10 },
  barInner: { flex: 1, flexDirection: 'row', gap: 4 },
  tab: { flex: 1, minHeight: 56, borderRadius: layout.radiusPill, alignItems: 'center', justifyContent: 'center', gap: 6 },
  activeTab: { backgroundColor: colors.paperRaised },
  tabMarker: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ruleStrong },
  activeMarker: { backgroundColor: colors.accent },
  label: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  activeText: { color: colors.ink },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
