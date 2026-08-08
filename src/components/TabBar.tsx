import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTab } from '@/types';
import { colors, layout, type } from '@/theme';

export function TabBar({ activeTab, onChange }: { activeTab: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <View style={styles.bar}>
      <Tab label="TUNER" hint="01" active={activeTab === 'tuner'} onPress={() => onChange('tuner')} />
      <Tab label="PLAYER" hint="02" active={activeTab === 'player'} onPress={() => onChange('player')} />
    </View>
  );
}

function Tab({ label, hint, active, onPress }: { label: string; hint: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.tab, active && styles.activeTab]}>
      <Text style={[styles.hint, active && styles.activeText]}>{hint}</Text>
      <Text style={[type.section, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { height: layout.tabBarHeight, backgroundColor: colors.panel, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 4 },
  tab: { flex: 1, gap: 4, alignItems: 'center', justifyContent: 'center', marginTop: 8, borderTopWidth: 2, borderColor: 'transparent' },
  activeTab: { borderColor: colors.red },
  hint: { ...type.mono, color: colors.textDim },
  activeText: { color: colors.redBright },
});
