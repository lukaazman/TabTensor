import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RangeSlider } from '@/components/RangeSlider';
import { colors, type } from '@/theme';
import { PlaybackTrack } from '@/types';

export function TrackRow({ track, selected, onSelect, onMute, onVolume }: { track: PlaybackTrack; selected: boolean; onSelect: () => void; onMute: () => void; onVolume: (value: number) => void }) {
  return (
    <View style={[styles.row, selected && styles.selected]}>
      <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onSelect} style={styles.trackMain}>
        <View style={[styles.trackMarker, selected && styles.markerSelected]} />
        <View style={styles.nameWrap}><Text style={type.body} numberOfLines={1}>{track.name}</Text><Text style={type.caption}>{track.notes.length} notes{track.instrument ? ` · ${track.instrument}` : ''}</Text></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${track.muted ? 'Unmute' : 'Mute'} ${track.name}`} onPress={onMute} style={[styles.mute, track.muted && styles.mutedActive]}><Text style={[type.mono, track.muted && styles.mutedText]}>{track.muted ? 'MUTED' : 'MUTE'}</Text></Pressable>
      <View style={styles.slider}><RangeSlider value={track.volume} onChange={onVolume} label="VOL" valueLabel={`${Math.round(track.volume * 100)}%`} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderTopWidth: 1, borderColor: colors.border, paddingVertical: 12, gap: 10 },
  selected: { borderLeftWidth: 3, borderLeftColor: colors.red, paddingLeft: 10 },
  trackMain: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  trackMarker: { width: 8, height: 8, backgroundColor: colors.borderStrong },
  markerSelected: { backgroundColor: colors.redBright },
  nameWrap: { flex: 1, gap: 2 },
  mute: { position: 'absolute', right: 0, top: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 6 },
  mutedActive: { borderColor: colors.red, backgroundColor: colors.redDim },
  mutedText: { color: colors.redBright },
  slider: { paddingRight: 58 },
});
