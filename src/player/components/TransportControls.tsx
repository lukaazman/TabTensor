import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RangeSlider } from '@/components/RangeSlider';
import { colors, layout, type } from '@/theme';
import { formatTime } from '@/utils/format';

const STOP_SYMBOL = '\u25A0';
const COUNT_SYMBOL = '\u2669';

type Props = {
  position: number;
  duration: number;
  state: string;
  speed: number;
  countIn: boolean;
  onToggleCountIn: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (position: number) => void;
  onSpeed: (speed: number) => void;
  loopStart: number | null;
  loopEnd: number | null;
  loopEnabled: boolean;
  canLoop: boolean;
  onSetLoopPoint: (point: 'start' | 'end') => void;
  onToggleLoop: () => void;
};

export function TransportControls({ position, duration, state, speed, countIn, onToggleCountIn, onPlay, onPause, onStop, onSeek, onSpeed, loopStart, loopEnd, loopEnabled, canLoop, onSetLoopPoint, onToggleLoop }: Props) {
  const playing = state === 'playing';
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
        <Pressable accessibilityRole="switch" accessibilityLabel="Toggle count-in" accessibilityState={{ checked: countIn }} onPress={onToggleCountIn} hitSlop={3} style={({ pressed }) => [styles.countButton, countIn && styles.countButtonActive, pressed && styles.pressed]}>
          <Text style={[styles.countIcon, countIn && styles.countActiveText]}>{COUNT_SYMBOL}</Text>
          <Text style={[styles.countLabel, countIn && styles.countActiveText]}>COUNT</Text>
        </Pressable>
      </View>

      <RangeSlider value={position} min={0} max={Math.max(duration, 1)} onChange={onSeek} label="TIMELINE" valueLabel={`${formatTime(position)} / ${formatTime(duration)}`} />

      <View style={styles.loopRow}>
        <Text style={type.caption}>A/B LOOP</Text>
        <View style={styles.loopButtons}>
          <Pressable accessibilityRole="button" accessibilityLabel={loopStart === null ? 'Set loop start' : 'Move loop start'} onPress={() => onSetLoopPoint('start')} style={[styles.loopButton, loopStart !== null && styles.loopButtonSet]}>
            <Text style={[type.mono, loopStart !== null && styles.activeText]}>A{loopStart === null ? '' : ' ' + formatTime(loopStart)}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={loopEnd === null ? 'Set loop end' : 'Move loop end'} onPress={() => onSetLoopPoint('end')} style={[styles.loopButton, loopEnd !== null && styles.loopButtonSet]}>
            <Text style={[type.mono, loopEnd !== null && styles.activeText]}>B{loopEnd === null ? '' : ' ' + formatTime(loopEnd)}</Text>
          </Pressable>
          <Pressable accessibilityRole="switch" accessibilityLabel="Toggle A/B loop" accessibilityState={{ checked: loopEnabled, disabled: !canLoop }} disabled={!canLoop} onPress={onToggleLoop} style={[styles.loopButton, loopEnabled && styles.loopButtonActive, !canLoop && styles.disabledButton]}>
            <Text style={[type.mono, loopEnabled && styles.activeText]}>LOOP</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={type.caption}>{playing ? 'PLAYING' : state === 'paused' ? 'PAUSED' : 'READY'}</Text>
        <View style={styles.speedWrap}>
          <Text style={type.caption}>SPEED</Text>
          <View style={styles.speedRow}>
            {[0.25, 0.5, 0.75, 1].map((option) => (
                <Pressable key={option} accessibilityRole="button" accessibilityLabel={`Set playback speed to ${Math.round(option * 100)} percent`} accessibilityState={{ selected: speed === option }} onPress={() => onSpeed(option)} hitSlop={2} style={({ pressed }) => [styles.speed, speed === option && styles.speedActive, pressed && styles.pressed]}>
                <Text style={[type.mono, speed === option && styles.activeText]}>{Math.round(option * 100)}%</Text>
              </Pressable>
            ))}
          </View>
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
  countButton: { width: 54, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusControl, gap: 1 },
  countButtonActive: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  countIcon: { color: colors.ink, fontSize: 20, lineHeight: 21 },
  countLabel: { color: colors.ink, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  countActiveText: { color: colors.accentBright },
  loopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  loopButtons: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 },
  loopButton: { minHeight: 38, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusControl },
  loopButtonSet: { borderColor: colors.accent },
  loopButtonActive: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  disabledButton: { opacity: 0.45 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  speedWrap: { alignItems: 'flex-end', gap: 5 },
  speedRow: { flexDirection: 'row', gap: 4 },
  speed: { minWidth: 39, minHeight: 44, paddingVertical: 5, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusControl },
  speedActive: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  activeText: { color: colors.accentBright },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
