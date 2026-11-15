import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RangeSlider } from '@/components/RangeSlider';
import { colors, pressed, radius, type } from '@/theme';
import { PlaybackTrack } from '@/types';

export function TrackRow({
  track,
  selected,
  onSelect,
  onMute,
  onVolume,
}: {
  track: PlaybackTrack;
  selected: boolean;
  onSelect: () => void;
  onMute: () => void;
  onVolume: (value: number) => void;
}) {
  return (
    <View style={[styles.row, selected && styles.selected]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        onPress={onSelect}
        hitSlop={2}
        style={({ pressed }) => [styles.trackMain, pressed && styles.pressed]}
      >
        <View style={styles.nameWrap}>
          <Text style={type.body} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={type.caption}>
            {track.notes.length} notes{track.instrument ? ` · ${track.instrument}` : ''}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${track.muted ? 'Unmute' : 'Mute'} ${track.name}`}
        onPress={onMute}
        hitSlop={2}
        style={({ pressed }) => [styles.mute, track.muted && styles.mutedActive, pressed && styles.pressed]}
      >
        <Text style={[type.meta, track.muted && styles.mutedText]}>{track.muted ? 'Muted' : 'Mute'}</Text>
      </Pressable>
      <View style={styles.slider}>
        <RangeSlider
          value={track.volume}
          onChange={onVolume}
          label={`Volume for ${track.name}`}
          valueLabel={`${Math.round(track.volume * 100)}%`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderTopWidth: 1, borderColor: colors.rule, paddingVertical: 13, gap: 10 },
  selected: { backgroundColor: colors.accentTint },
  trackMain: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  nameWrap: { flex: 1, gap: 2, minWidth: 0 },
  mute: {
    position: 'absolute',
    right: 0,
    top: 13,
    minHeight: 44,
    minWidth: 58,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.control,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedActive: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  mutedText: { color: colors.accent },
  slider: { paddingRight: 62 },
  pressed,
});
