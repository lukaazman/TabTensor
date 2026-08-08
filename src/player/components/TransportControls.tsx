import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RangeSlider } from '@/components/RangeSlider';
import { colors, type } from '@/theme';
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
};

export function TransportControls({ position, duration, state, speed, countIn, onToggleCountIn, onPlay, onPause, onStop, onSeek, onSpeed }: Props) {
  const playing = state === 'playing';
  return (
    <View style={styles.wrap}>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Stop and restart" onPress={onStop} style={[styles.transportButton, styles.stopButton]}>
          <Text style={styles.buttonSymbol}>{STOP_SYMBOL}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause playback' : 'Play playback'} onPress={playing ? onPause : onPlay} style={[styles.transportButton, styles.playButton]}>
          <Text style={styles.buttonSymbol}>{playing ? '||' : '>'}</Text>
        </Pressable>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.duration}>/ {formatTime(duration)}</Text>
        </View>
        <Pressable accessibilityRole="switch" accessibilityLabel="Toggle count-in" accessibilityState={{ checked: countIn }} onPress={onToggleCountIn} style={[styles.countButton, countIn && styles.countButtonActive]}>
          <Text style={[styles.countIcon, countIn && styles.countActiveText]}>{COUNT_SYMBOL}</Text>
          <Text style={[styles.countLabel, countIn && styles.countActiveText]}>COUNT</Text>
        </Pressable>
      </View>

      <RangeSlider value={position} min={0} max={Math.max(duration, 1)} onChange={onSeek} label="TIMELINE" valueLabel={`${formatTime(position)} / ${formatTime(duration)}`} />

      <View style={styles.bottomRow}>
        <Text style={type.caption}>{playing ? 'PLAYING' : state === 'paused' ? 'PAUSED' : 'READY'}</Text>
        <View style={styles.speedWrap}>
          <Text style={type.caption}>SPEED</Text>
          <View style={styles.speedRow}>
            {[0.25, 0.5, 0.75, 1].map((option) => (
              <Pressable key={option} onPress={() => onSpeed(option)} style={[styles.speed, speed === option && styles.speedActive]}>
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
  wrap: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 10, marginTop: 14 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  transportButton: { width: 54, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 3 },
  stopButton: { backgroundColor: colors.panelRaised, borderColor: colors.borderStrong },
  playButton: { backgroundColor: colors.red, borderColor: colors.red },
  buttonSymbol: { color: colors.white, fontSize: 21, fontWeight: '900', letterSpacing: -1 },
  timeBlock: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 4, minWidth: 72 },
  time: { color: colors.white, fontSize: 21, fontWeight: '700', fontVariant: ['tabular-nums'] },
  duration: { color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'] },
  countButton: { width: 58, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.white, gap: 1 },
  countButtonActive: { borderColor: colors.red, backgroundColor: colors.redDim },
  countIcon: { color: colors.white, fontSize: 20, lineHeight: 21 },
  countLabel: { color: colors.white, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  countActiveText: { color: colors.redBright },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  speedWrap: { alignItems: 'flex-end', gap: 5 },
  speedRow: { flexDirection: 'row', gap: 4 },
  speed: { minWidth: 39, paddingVertical: 5, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  speedActive: { borderColor: colors.red, backgroundColor: colors.redDim },
  activeText: { color: colors.redBright },
});
