/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RangeSlider } from '@/components/RangeSlider';
import { colors, layout, type } from '@/theme';
import { PlaybackTrack } from '@/types';

export function TrackRow({ track, selected, onSelect, onMute, onVolume }: { track: PlaybackTrack; selected: boolean; onSelect: () => void; onMute: () => void; onVolume: (value: number) => void }) {
  return (
    <View style={[styles.row, selected && styles.selected]}>
      <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onSelect} hitSlop={2} style={({ pressed }) => [styles.trackMain, pressed && styles.pressed]}>
        <View style={[styles.trackMarker, selected && styles.markerSelected]} />
        <View style={styles.nameWrap}><Text style={type.body} numberOfLines={1}>{track.name}</Text><Text style={type.caption}>{track.notes.length} notes{track.instrument ? ` · ${track.instrument}` : ''}</Text></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${track.muted ? 'Unmute' : 'Mute'} ${track.name}`} onPress={onMute} hitSlop={2} style={({ pressed }) => [styles.mute, track.muted && styles.mutedActive, pressed && styles.pressed]}><Text style={[type.mono, track.muted && styles.mutedText]}>{track.muted ? 'Muted' : 'Mute'}</Text></Pressable>
      <View style={styles.slider}><RangeSlider value={track.volume} onChange={onVolume} label="Volume" valueLabel={`${Math.round(track.volume * 100)}%`} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderTopWidth: 1, borderColor: colors.rule, paddingVertical: 13, gap: 10 },
  selected: { backgroundColor: colors.accentWash },
  trackMain: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  trackMarker: { width: 8, height: 8, borderRadius: 2, backgroundColor: colors.ruleStrong },
  markerSelected: { backgroundColor: colors.accentBright },
  nameWrap: { flex: 1, gap: 2, minWidth: 0 },
  mute: { position: 'absolute', right: 0, top: 13, minHeight: 44, minWidth: 58, borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusControl, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  mutedActive: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  mutedText: { color: colors.accentBright },
  slider: { paddingRight: 62 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
