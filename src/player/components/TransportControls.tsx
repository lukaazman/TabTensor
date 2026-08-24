/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RangeSlider } from '@/components/RangeSlider';
import { colors, layout, type } from '@/theme';
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

export function TransportControls({ position, duration, state, speed, countIn, onPlay, onPause, onStop, onSeek, onOpenOptions, loopEnabled }: Props) {
  const playing = state === 'playing';
  const optionsSummary = [
    `${Math.round(speed * 100)}%`,
    countIn ? 'count-in' : null,
    loopEnabled ? 'loop' : null,
  ].filter(Boolean).join(' · ');

  return (
    <View style={styles.wrap}>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Stop and restart" onPress={onStop} hitSlop={3} style={({ pressed }) => [styles.transportButton, styles.stopButton, pressed && styles.pressed]}>
          <Text style={styles.buttonSymbol}>{STOP_SYMBOL}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause playback' : 'Play playback'} onPress={playing ? onPause : onPlay} hitSlop={3} style={({ pressed }) => [styles.transportButton, styles.playButton, pressed && styles.pressed]}>
          <Text style={[styles.buttonSymbol, styles.playSymbol]}>{playing ? '||' : '>'}</Text>
        </Pressable>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.duration}>/ {formatTime(duration)}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open playback controls" onPress={onOpenOptions} hitSlop={3} style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}>
          <Text style={styles.optionsLabel}>Controls</Text>
          <Text style={styles.optionsSummary}>{optionsSummary}</Text>
        </Pressable>
      </View>

      <RangeSlider value={position} min={0} max={Math.max(duration, 1)} onChange={onSeek} label="Timeline" valueLabel={`${formatTime(position)} / ${formatTime(duration)}`} />

      <View style={styles.statusRow}>
        <Text style={type.caption}>{playing ? 'Playing' : state === 'paused' ? 'Paused' : 'Ready'}</Text>
        <Text style={[type.mono, styles.statusHint]}>Tap Controls for practice settings</Text>
      </View>
    </View>
  );
}

export function TransportOptions({ speed, countIn, onToggleCountIn, onSpeed, loopStart, loopEnd, loopEnabled, canLoop, onSetLoopPoint, onToggleLoop }: TransportOptionsProps) {
  return (
    <View style={styles.optionsPanel}>
      <View style={styles.optionsHeader}>
        <Text style={type.screenTitle}>Playback controls</Text>
        <Text style={type.caption}>Keep the score clear while you practice.</Text>
      </View>

      <View style={styles.optionRow}>
        <View style={styles.optionCopy}>
          <Text style={type.body}>Count-in</Text>
          <Text style={type.caption}>Hear a bar before the notes start.</Text>
        </View>
        <Pressable accessibilityRole="switch" accessibilityLabel="Toggle count-in" accessibilityState={{ checked: countIn }} onPress={onToggleCountIn} style={({ pressed }) => [styles.toggle, countIn && styles.toggleActive, pressed && styles.pressed]}>
          <Text style={[type.mono, countIn && styles.activeText]}>{countIn ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>

      <View style={styles.optionGroup}>
        <Text style={type.section}>A/B loop</Text>
        <View style={styles.loopButtons}>
          <Pressable accessibilityRole="button" accessibilityLabel={loopStart === null ? 'Set loop start' : 'Move loop start'} onPress={() => onSetLoopPoint('start')} style={[styles.loopButton, loopStart !== null && styles.loopButtonSet]}>
            <Text style={[type.mono, loopStart !== null && styles.activeText]}>A{loopStart === null ? '' : ' ' + formatTime(loopStart)}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={loopEnd === null ? 'Set loop end' : 'Move loop end'} onPress={() => onSetLoopPoint('end')} style={[styles.loopButton, loopEnd !== null && styles.loopButtonSet]}>
            <Text style={[type.mono, loopEnd !== null && styles.activeText]}>B{loopEnd === null ? '' : ' ' + formatTime(loopEnd)}</Text>
          </Pressable>
          <Pressable accessibilityRole="switch" accessibilityLabel="Toggle A/B loop" accessibilityState={{ checked: loopEnabled, disabled: !canLoop }} disabled={!canLoop} onPress={onToggleLoop} style={[styles.loopButton, loopEnabled && styles.loopButtonActive, !canLoop && styles.disabledButton]}>
            <Text style={[type.mono, loopEnabled && styles.activeText]}>Loop</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.optionGroup}>
        <Text style={type.section}>Playback speed</Text>
        <View style={styles.speedRow}>
          {[0.25, 0.5, 0.75, 1].map((option) => (
            <Pressable key={option} accessibilityRole="button" accessibilityLabel={`Set playback speed to ${Math.round(option * 100)} percent`} accessibilityState={{ selected: speed === option }} onPress={() => onSpeed(option)} hitSlop={2} style={({ pressed }) => [styles.speed, speed === option && styles.speedActive, pressed && styles.pressed]}>
              <Text style={[type.mono, speed === option && styles.activeText]}>{Math.round(option * 100)}%</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusCard, padding: 12, gap: 11, marginTop: 14 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  transportButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: layout.radiusControl },
  stopButton: { backgroundColor: colors.paperSoft, borderColor: colors.ruleStrong },
  playButton: { width: 52, backgroundColor: colors.accent, borderColor: colors.accent },
  buttonSymbol: { color: colors.ink, fontSize: 20, fontWeight: '900', letterSpacing: -1 },
  playSymbol: { color: colors.accentInk },
  timeBlock: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 4, minWidth: 56 },
  time: { color: colors.ink, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  duration: { color: colors.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  optionsButton: { minWidth: 78, height: 48, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusControl, gap: 2 },
  optionsLabel: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  optionsSummary: { color: colors.accentBright, fontFamily: 'monospace', fontSize: 8, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusHint: { color: colors.neutral, fontSize: 9 },
  optionsPanel: { gap: 18 },
  optionsHeader: { gap: 6, paddingBottom: 2 },
  optionRow: { minHeight: 58, paddingVertical: 10, borderTopWidth: 1, borderColor: colors.rule, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionCopy: { flex: 1, minWidth: 0, gap: 3 },
  toggle: { minWidth: 60, minHeight: 42, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusControl },
  toggleActive: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  optionGroup: { gap: 9 },
  loopButtons: { flexDirection: 'row', justifyContent: 'flex-start', gap: 5 },
  loopButton: { minHeight: 42, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusControl },
  loopButtonSet: { borderColor: colors.accent },
  loopButtonActive: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  disabledButton: { opacity: 0.45 },
  speedRow: { flexDirection: 'row', gap: 6 },
  speed: { minWidth: 48, minHeight: 44, paddingVertical: 5, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusControl },
  speedActive: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  activeText: { color: colors.accentBright },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
