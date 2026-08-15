/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, layout, type } from '@/theme';

export function TunerGauge({ cents, active }: { cents?: number; active: boolean }) {
  const clamped = Math.min(50, Math.max(-50, cents ?? 0));
  const fraction = (clamped + 50) / 100;
  return (
    <View style={styles.wrap}>
      <View style={styles.labels}><Text style={type.mono}>−50</Text><Text style={type.mono}>0</Text><Text style={type.mono}>+50</Text></View>
      <View style={styles.scale}>
        <View style={styles.centerLine} />
        <View style={[styles.needle, { left: `${fraction * 100}%` }, active && styles.needleActive]} />
        <View style={styles.tickRow}>{Array.from({ length: 11 }, (_, index) => <View key={index} style={[styles.tick, index === 5 && styles.centerTick]} />)}</View>
      </View>
      <Text style={[type.caption, styles.help]}>{active ? 'Tune until the marker settles at zero.' : 'Play a string to see pitch.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 9 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  scale: { height: 40, backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusControl, justifyContent: 'center', position: 'relative' },
  centerLine: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: colors.ink, opacity: 0.65 },
  needle: { position: 'absolute', top: 4, bottom: 4, width: 2, marginLeft: -1, backgroundColor: colors.neutral },
  needleActive: { backgroundColor: colors.accentBright, width: 3, marginLeft: -1.5 },
  tickRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tick: { height: 8, width: 1, backgroundColor: colors.ruleStrong },
  centerTick: { height: 16, backgroundColor: colors.ink },
  help: { textAlign: 'center' },
});
