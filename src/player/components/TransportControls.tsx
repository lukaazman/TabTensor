import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RangeSlider } from '@/components/RangeSlider';
import { colors, font, pressed, radius, size, type } from '@/theme';
import { formatTime } from '@/utils/format';

const STOP_SYMBOL = '\u25A0';

export type TransportOptionsProps = {
  speed: number;
  countIn: boolean;
  onToggleCountIn: () => void;
  onSpeed: (speed: number) => void;
  loopStart: number | null;
  loopEnd: number | null;
  loopEnabled: boolean;
  canLoop: boolean;
  onSetLoopPoint: (point: 'start' | 'end') => void;
  onToggleLoop: () => void;
};

type Props = {
  position: number;
  duration: number;
  state: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (position: number) => void;
  onOpenOptions: () => void;
} & TransportOptionsProps;

export function TransportControls({
  position,
  duration,
  state,
  speed,
  countIn,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onOpenOptions,
  loopEnabled,
}: Props) {
  const playing = state === 'playing';
  const optionsSummary = [`${Math.round(speed * 100)}%`, countIn ? 'count-in' : null, loopEnabled ? 'loop' : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.wrap}>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stop and restart"
          onPress={onStop}
          hitSlop={3}
          style={({ pressed }) => [styles.transportButton, styles.stopButton, pressed && styles.pressed]}
        >
          <Text style={styles.buttonSymbol}>{STOP_SYMBOL}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause playback' : 'Play playback'}
          onPress={playing ? onPause : onPlay}
          hitSlop={3}
          style={({ pressed }) => [styles.transportButton, styles.playButton, pressed && styles.pressed]}
        >
          <Text style={[styles.buttonSymbol, styles.playSymbol]}>{playing ? '||' : '>'}</Text>
        </Pressable>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.duration}>/ {formatTime(duration)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open playback controls"
          onPress={onOpenOptions}
          hitSlop={3}
          style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
        >
          <Text style={styles.optionsLabel}>Controls</Text>
          <Text style={styles.optionsSummary}>{optionsSummary}</Text>
        </Pressable>
      </View>

      <RangeSlider
        value={position}
        min={0}
        max={Math.max(duration, 1)}
        onChange={onSeek}
        label="Timeline"
        valueLabel={`${formatTime(position)} / ${formatTime(duration)}`}
      />

      <View style={styles.statusRow}>
        <Text style={type.caption}>{playing ? 'Playing' : state === 'paused' ? 'Paused' : 'Ready'}</Text>
        <Text style={[type.meta, styles.statusHint]}>Tap Controls for practice settings</Text>
      </View>
    </View>
  );
}

export function TransportOptions({
  speed,
  countIn,
  onToggleCountIn,
  onSpeed,
  loopStart,
  loopEnd,
  loopEnabled,
  canLoop,
  onSetLoopPoint,
  onToggleLoop,
}: TransportOptionsProps) {
  return (
    <View style={styles.optionsPanel}>
      <View style={styles.optionsHeader}>
        <Text style={type.title}>Playback controls</Text>
        <Text style={type.caption}>Keep the score clear while you practice.</Text>
      </View>

      <View style={styles.optionRow}>
        <View style={styles.optionCopy}>
          <Text style={type.body}>Count-in</Text>
          <Text style={type.caption}>Hear a bar before the notes start.</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Toggle count-in"
          accessibilityState={{ checked: countIn }}
          onPress={onToggleCountIn}
          style={({ pressed }) => [styles.toggle, countIn && styles.toggleActive, pressed && styles.pressed]}
        >
          <Text style={[type.meta, countIn && styles.activeText]}>{countIn ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>

      <View style={styles.optionGroup}>
        <Text style={type.section}>A/B loop</Text>
        <View style={styles.loopButtons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={loopStart === null ? 'Set loop start' : 'Move loop start'}
            onPress={() => onSetLoopPoint('start')}
            style={[styles.loopButton, loopStart !== null && styles.loopButtonSet]}
          >
            <Text style={[type.meta, loopStart !== null && styles.activeText]}>
              A{loopStart === null ? '' : ' ' + formatTime(loopStart)}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={loopEnd === null ? 'Set loop end' : 'Move loop end'}
            onPress={() => onSetLoopPoint('end')}
            style={[styles.loopButton, loopEnd !== null && styles.loopButtonSet]}
          >
            <Text style={[type.meta, loopEnd !== null && styles.activeText]}>
              B{loopEnd === null ? '' : ' ' + formatTime(loopEnd)}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Toggle A/B loop"
            accessibilityState={{ checked: loopEnabled, disabled: !canLoop }}
            disabled={!canLoop}
            onPress={onToggleLoop}
            style={[styles.loopButton, loopEnabled && styles.loopButtonActive, !canLoop && styles.disabledButton]}
          >
            <Text style={[type.meta, loopEnabled && styles.activeText]}>Loop</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.optionGroup}>
        <Text style={type.section}>Playback speed</Text>
        <View style={styles.speedRow}>
          {[0.25, 0.5, 0.75, 1].map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Set playback speed to ${Math.round(option * 100)} percent`}
              accessibilityState={{ selected: speed === option }}
              onPress={() => onSpeed(option)}
              hitSlop={2}
              style={({ pressed }) => [styles.speed, speed === option && styles.speedActive, pressed && styles.pressed]}
            >
              <Text style={[type.meta, speed === option && styles.activeText]}>{Math.round(option * 100)}%</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.card,
    padding: 12,
    gap: 11,
    marginTop: 14,
  },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  transportButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.control,
  },
  stopButton: { backgroundColor: colors.raised, borderColor: colors.control },
  playButton: { width: 52, backgroundColor: colors.accent, borderColor: colors.accent },
  buttonSymbol: { color: colors.ink, fontSize: size.title, fontFamily: font.semibold },
  playSymbol: { color: colors.onAccent },
  timeBlock: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 4, minWidth: 56 },
  time: { color: colors.ink, fontSize: size.title, fontVariant: ['tabular-nums'], fontFamily: font.semibold },
  duration: { color: colors.faint, fontFamily: font.regular, fontSize: size.meta, fontVariant: ['tabular-nums'] },
  optionsButton: {
    minWidth: 78,
    height: 48,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.control,
    borderRadius: radius.control,
    gap: 2,
  },
  optionsLabel: { color: colors.ink, fontSize: size.meta, fontFamily: font.semibold },
  optionsSummary: { color: colors.accent, fontFamily: font.mono, fontSize: size.meta },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusHint: { color: colors.faint, fontSize: size.meta },
  optionsPanel: { gap: 18 },
  optionsHeader: { gap: 6, paddingBottom: 2 },
  optionRow: {
    minHeight: 58,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: colors.rule,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCopy: { flex: 1, minWidth: 0, gap: 3 },
  toggle: {
    minWidth: 60,
    minHeight: 42,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.control,
    borderRadius: radius.control,
  },
  toggleActive: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  optionGroup: { gap: 9 },
  loopButtons: { flexDirection: 'row', justifyContent: 'flex-start', gap: 5 },
  loopButton: {
    minHeight: 42,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.control,
  },
  loopButtonSet: { borderColor: colors.accent },
  loopButtonActive: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  disabledButton: { opacity: 0.45 },
  speedRow: { flexDirection: 'row', gap: 6 },
  speed: {
    minWidth: 48,
    minHeight: 44,
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.control,
  },
  speedActive: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  activeText: { color: colors.accent },
  pressed,
});
