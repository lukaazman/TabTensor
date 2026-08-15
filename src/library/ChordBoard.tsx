/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, layout, type } from '@/theme';
import { ChordDefinition } from '@/library/chords';

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'E'];
const FRET_COUNT = 5;

export function ChordBoard({ chord }: { chord: ChordDefinition }) {
  const { width } = useWindowDimensions();
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [voicingIndex, setVoicingIndex] = useState(0);
  const voicings = chord.voicings?.length > 0
    ? chord.voicings
    : [{ frets: chord.frets, baseFret: chord.baseFret }];
  const activeVoicingIndex = Math.min(voicingIndex, voicings.length - 1);
  const voicing = voicings[activeVoicingIndex];
  const displayedChord: ChordDefinition = { ...chord, frets: voicing.frets, baseFret: voicing.baseFret };
  const boardWidth = Math.min(312, Math.max(232, width - 72));

  useEffect(() => {
    setVoicingIndex(0);
    setSelectedString(null);
  }, [chord.id]);
  const selectedLabel = selectedString === null
    ? 'Tap a string for detail'
    : 'STRING ' + STRING_LABELS[selectedString] + ' ' + String.fromCharCode(183) + ' ' + fretDescription(displayedChord, displayedChord.frets[selectedString]);

  return (
    <View style={[styles.shell, { width: boardWidth }]} accessibilityLabel={`${chord.name} guitar chord diagram`}>
      <View style={styles.boardTopline}>
        <Text style={[type.mono, styles.positionLabel]}>{displayedChord.baseFret === 0 ? 'Open position' : `Position ${displayedChord.baseFret}`}</Text>
      </View>

      <View style={styles.markerRow}>
        {displayedChord.frets.map((fret, index) => (
          <Pressable
            key={`marker-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`${STRING_LABELS[index]} string, ${fretDescription(chord, fret)}`}
            onPress={() => setSelectedString(index)}
            style={({ pressed }) => [styles.marker, selectedString === index && styles.markerSelected, pressed && styles.pressed]}
          >
            <Text style={[styles.markerText, fret === 'x' && styles.markerMuted, selectedString === index && styles.markerTextSelected]}>
              {markerSymbol(chord, fret)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.diagramRow}>
        <View style={styles.fretNumbers} pointerEvents="none">
          {Array.from({ length: FRET_COUNT }, (_, index) => (
            <Text key={index} style={[type.mono, styles.fretNumber]}>
              {String(displayedChord.baseFret === 0 ? index + 1 : displayedChord.baseFret + index)}
            </Text>
          ))}
        </View>
        <View style={styles.diagram}>
          {Array.from({ length: FRET_COUNT + 1 }, (_, index) => (
            <View key={`fret-${index}`} pointerEvents="none" style={[styles.fretLine, { top: `${(index / FRET_COUNT) * 100}%` }]} />
          ))}
          {STRING_LABELS.map((_, index) => (
            <View key={`string-${index}`} pointerEvents="none" style={[styles.stringLine, { left: `${(index / (STRING_LABELS.length - 1)) * 100}%` }]} />
          ))}
          {displayedChord.frets.map((fret, index) => {
            if (fret === 'x' || (displayedChord.baseFret === 0 && fret === 0)) return null;
            const slot = displayedChord.baseFret === 0 ? fret : fret + 1;
            if (typeof slot !== 'number' || slot < 1 || slot > FRET_COUNT) return null;
            return (
              <Pressable
                key={`dot-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${STRING_LABELS[index]} string, ${fretDescription(chord, fret)}`}
                onPress={() => setSelectedString(index)}
                style={({ pressed }) => [
                  styles.dotHit,
                  { left: `${(index / (STRING_LABELS.length - 1)) * 100}%`, top: `${((slot - 0.5) / FRET_COUNT) * 100}%` },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.dot, selectedString === index && styles.dotSelected]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.labelRow}>
        {STRING_LABELS.map((label, index) => (
          <Pressable key={`label-${index}`} onPress={() => setSelectedString(index)} style={styles.stringLabel} accessibilityRole="button">
            <Text style={[type.mono, styles.stringLabelText, selectedString === index && styles.stringLabelSelected]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.readout}>
        <View style={[styles.readoutDot, selectedString !== null && styles.readoutDotActive]} />
        <Text style={[type.mono, styles.readoutText, selectedString !== null && styles.readoutTextActive]}>{selectedLabel}</Text>
      </View>

      <View style={styles.voicingControls} accessibilityLabel={'Chord voicing ' + (activeVoicingIndex + 1) + ' of ' + voicings.length}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous chord voicing"
          disabled={activeVoicingIndex === 0}
          onPress={() => {
            setSelectedString(null);
            setVoicingIndex((current) => Math.max(0, current - 1));
          }}
          style={({ pressed }) => [styles.voicingArrow, activeVoicingIndex === 0 && styles.voicingArrowDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.voicingArrowText}>{String.fromCharCode(8249)}</Text>
        </Pressable>
        <Text style={[type.mono, styles.voicingIndex]}>{activeVoicingIndex + 1} / {voicings.length}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next chord voicing"
          disabled={activeVoicingIndex === voicings.length - 1}
          onPress={() => {
            setSelectedString(null);
            setVoicingIndex((current) => Math.min(voicings.length - 1, current + 1));
          }}
          style={({ pressed }) => [styles.voicingArrow, activeVoicingIndex === voicings.length - 1 && styles.voicingArrowDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.voicingArrowText}>{String.fromCharCode(8250)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function markerSymbol(chord: ChordDefinition, fret: number | 'x'): string {
  if (fret === 'x') return '×';
  if (chord.baseFret === 0 && fret === 0) return '○';
  return '•';
}

function fretDescription(chord: ChordDefinition, fret: number | 'x'): string {
  if (fret === 'x') return 'MUTED';
  if (chord.baseFret === 0 && fret === 0) return 'OPEN';
  return `FRET ${chord.baseFret + fret}`;
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'center',
    padding: 16,
    borderRadius: layout.radiusCard,
    borderWidth: 1,
    borderColor: colors.ruleStrong,
    backgroundColor: colors.paper,
  },
  boardTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  positionLabel: { color: colors.accentBright, fontSize: 10, letterSpacing: 1 },
  markerRow: { marginLeft: 34, flexDirection: 'row', alignItems: 'center' },
  marker: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: layout.radiusControl },
  markerSelected: { backgroundColor: colors.accentWash },
  markerText: { color: colors.inkMuted, fontSize: 18, lineHeight: 22, fontWeight: '800' },
  markerMuted: { color: colors.accentBright },
  markerTextSelected: { color: colors.accentBright },
  diagramRow: { flexDirection: 'row', height: 190 },
  fretNumbers: { width: 30, justifyContent: 'space-around', alignItems: 'flex-start', paddingVertical: 3 },
  fretNumber: { color: colors.neutral, fontSize: 9, lineHeight: 32 },
  diagram: { flex: 1, position: 'relative', marginHorizontal: 3, borderTopWidth: 2, borderColor: colors.inkMuted },
  fretLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.ruleStrong },
  stringLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.inkMuted, opacity: 0.82 },
  dotHit: { position: 'absolute', width: 40, height: 40, marginLeft: -20, marginTop: -20, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink },
  dotSelected: { backgroundColor: colors.accentBright, borderWidth: 3, borderColor: colors.ink },
  labelRow: { marginLeft: 34, flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  stringLabel: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  stringLabelText: { color: colors.muted, fontSize: 10 },
  stringLabelSelected: { color: colors.accentBright },
  readout: { minHeight: 38, marginTop: 10, paddingHorizontal: 10, borderTopWidth: 1, borderColor: colors.rule, flexDirection: 'row', alignItems: 'center', gap: 8 },
  readoutDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ruleStrong },
  readoutDotActive: { backgroundColor: colors.accentBright },
  readoutText: { color: colors.muted, fontSize: 9, letterSpacing: 0.8 },
  readoutTextActive: { color: colors.ink },
  voicingControls: { alignSelf: 'center', marginTop: 4, minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderTopWidth: 1, borderColor: colors.rule, paddingTop: 4 },
  voicingArrow: { width: 24, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.ruleStrong },
  voicingArrowDisabled: { opacity: 0.35 },
  voicingArrowText: { color: colors.ink, fontSize: 17, lineHeight: 19, fontWeight: '700' },
  voicingIndex: { minWidth: 42, color: colors.muted, fontSize: 9, textAlign: 'center', letterSpacing: 0.5 },
  pressed: { opacity: 0.76 },
});
