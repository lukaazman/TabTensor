import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme';
import { GuitarProSong, PlaybackMeasure, PlaybackNote, PlaybackTrack } from '@/types';
import { formatTime } from '@/utils/format';

const BASE_MEASURE_WIDTH = 190;
const MEASURE_HORIZONTAL_PADDING = 10;
const MIN_EVENT_GAP = 22;
const EVENT_SPACING_EXPONENT = 0.62;
const SCORE_HEIGHT = 330;
const STAFF_AREA_HEIGHT = 140;
const TAB_AREA_TOP = 140;
const STAFF_LINE_TOP = 55;
const STAFF_LINE_GAP = 13;
const TAB_LINE_TOP = 37;
const TAB_LINE_GAP = 18;
const NOTE_WIDTH = 18;

type NoteLayout = {
  note: PlaybackNote;
  left: number;
  center: number;
  staffTop: number;
  tabTop: number;
  tabLine: number;
};

type MeasureSpacing = {
  starts: number[];
  positions: number[];
  width: number;
};

type MeasureGeometry = MeasureSpacing & {
  index: number;
  left: number;
};

type MeasureRenderData = {
  measure: PlaybackMeasure;
  notes: PlaybackNote[];
  geometry: MeasureGeometry;
  layouts: NoteLayout[];
  staffRelations: Relation[];
  tabRelations: Relation[];
};

type Relation = {
  kind: 'slur' | 'bend' | 'slide' | 'vibrato' | 'sustain' | 'mute';
  layer: 'staff' | 'tab';
  left: number;
  width: number;
  top: number;
};

export function ScoreView({ song, track, position, onSeek, scrollToken = 0 }: { song: GuitarProSong; track: PlaybackTrack; position: number; onSeek: (position: number) => void; scrollToken?: number }) {
  const showTablature = song.capabilities.tablature && track.tablature !== false;
  const scrollRef = useRef<ScrollView | null>(null);
  const previousMeasureRef = useRef(-1);
  const previousPracticeScrollRef = useRef(0);
  const [viewportWidth, setViewportWidth] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);

  const notesByMeasure = useMemo(() => {
    const map = new Map<number, typeof track.notes>();
    track.notes.forEach((note) => {
      const measureNotes = map.get(note.measureIndex);
      if (measureNotes) measureNotes.push(note);
      else map.set(note.measureIndex, [note]);
    });
    return map;
  }, [track.notes]);

  const measureGeometries = useMemo(() => {
    let left = 0;
    return song.measures.map((measure) => {
      const spacing = buildMeasureSpacing(measure, notesByMeasure.get(measure.index) ?? []);
      const geometry: MeasureGeometry = { ...spacing, index: measure.index, left };
      left += spacing.width;
      return geometry;
    });
  }, [notesByMeasure, song.measures]);

  const timelineWidth = Math.max(
    viewportWidth,
    measureGeometries.reduce((right, geometry) => Math.max(right, geometry.left + geometry.width), BASE_MEASURE_WIDTH),
  );

  const visibleMeasureRange = useMemo(() => {
    if (!measureGeometries.length) return { start: 0, end: 0 };
    const windowStart = Math.max(0, scrollLeft - viewportWidth);
    const windowEnd = scrollLeft + viewportWidth * 2;
    let start = 0;
    while (
      start < measureGeometries.length - 1
      && measureGeometries[start].left + measureGeometries[start].width < windowStart
    ) {
      start += 1;
    }
    let end = start;
    while (end < measureGeometries.length && measureGeometries[end].left <= windowEnd) end += 1;
    return { start, end: Math.max(start + 1, end) };
  }, [measureGeometries, scrollLeft, viewportWidth]);

  const visibleMeasureData = useMemo(() => {
    return song.measures.slice(visibleMeasureRange.start, visibleMeasureRange.end).flatMap((measure) => {
      const geometry = measureGeometries.find((item) => item.index === measure.index);
      if (!geometry) return [];
      const notes = notesByMeasure.get(measure.index) ?? [];
      const relations = buildRelations(notes, measure, geometry);
      return [{
        measure,
        notes,
        geometry,
        layouts: notes.map((note) => layoutForNote(note, measure, geometry)),
        staffRelations: relations.filter((relation) => relation.layer === 'staff'),
        tabRelations: relations.filter((relation) => relation.layer === 'tab'),
      }];
    });
  }, [measureGeometries, notesByMeasure, song.measures, visibleMeasureRange]);

  const currentMeasure = useMemo(() => {
    const matching = song.measures.find((measure) => position >= measure.start && position < measure.start + measure.duration);
    return matching ?? song.measures.at(-1) ?? null;
  }, [position, song.measures]);

  const currentGeometry = currentMeasure ? measureGeometries.find((geometry) => geometry.index === currentMeasure.index) : null;
  const playheadLeft = currentMeasure && currentGeometry
    ? currentGeometry.left + xForTime(position, currentMeasure, currentGeometry)
    : 0;

  useEffect(() => {
    const measureChanged = currentMeasure?.index !== previousMeasureRef.current;
    const practiceAdvanced = scrollToken !== previousPracticeScrollRef.current;
    if (!currentMeasure || viewportWidth <= 1 || (!measureChanged && !practiceAdvanced)) return;
    previousMeasureRef.current = currentMeasure.index;
    previousPracticeScrollRef.current = scrollToken;
    scrollRef.current?.scrollTo({ x: Math.max(0, playheadLeft - viewportWidth * 0.34), animated: true });
  }, [currentMeasure, playheadLeft, scrollToken, viewportWidth]);

  return (
    <View style={styles.wrap}>
      <View style={styles.scoreHeader}>
        <View>
          <Text style={type.section}>{showTablature ? 'TAB PLAYER' : 'SCORE PLAYER'}</Text>
          <Text style={styles.trackName}>{track.name}</Text>
        </View>
        <View style={styles.timeReadout}>
          <Text style={styles.currentTime}>{formatTime(position)}</Text>
          <Text style={type.caption}> / {formatTime(song.duration)}</Text>
        </View>
      </View>

      <View onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)} style={styles.viewport}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={64}
          onScroll={(event) => setScrollLeft(event.nativeEvent.contentOffset.x)}
          contentContainerStyle={styles.content}
        >
          <View style={[styles.timeline, { width: timelineWidth }]}>
            {visibleMeasureData.map(({ measure, notes, geometry, layouts, staffRelations, tabRelations }) => {
              const active = currentMeasure?.index === measure.index;
              return (
                <Pressable
                  key={measure.index}
                  accessibilityRole="button"
                  accessibilityLabel={`Seek to measure ${measure.index + 1}`}
                  onPress={() => onSeek(measure.start)}
                  style={[styles.measure, { left: geometry.left, width: geometry.width }, active && styles.measureActive]}
                >
                  <View style={styles.measureHeader}>
                    <Text style={[type.mono, active && styles.activeText]}>M{String(measure.index + 1).padStart(2, '0')}</Text>
                    {measure.timeSignature ? <Text style={type.mono}>{measure.timeSignature}</Text> : null}
                  </View>

                  <View pointerEvents="none" style={styles.staffArea}>
                    {[0, 1, 2, 3, 4].map((line) => <View key={line} style={[styles.staffLine, { top: STAFF_LINE_TOP + line * STAFF_LINE_GAP }]} />)}
                    {measure.beats.map((beat) => renderBeatOverlay(beat, measure, geometry, notes))}
                    {staffRelations.map((relation, index) => <RelationMark key={`staff-${relation.kind}-${index}`} relation={relation} />)}
                    {layouts.map((layout) => <StaffNote key={`staff-${layout.note.id}`} layout={layout} position={position} />)}
                  </View>

                  {showTablature ? (
                    <View pointerEvents="none" style={styles.tabArea}>
                      {[0, 1, 2, 3, 4, 5].map((line) => <View key={line} style={[styles.tabLine, { top: TAB_LINE_TOP + line * TAB_LINE_GAP }]} />)}
                      {tabRelations.map((relation, index) => <RelationMark key={`tab-${relation.kind}-${index}`} relation={relation} />)}
                      {layouts.map((layout) => <TabNote key={`tab-${layout.note.id}`} layout={layout} position={position} />)}
                    </View>
                  ) : (
                    <View pointerEvents="none" style={styles.scoreOnlyFooter}>
                      <Text style={styles.scoreOnlyText}>STAFF NOTATION · {song.format}</Text>
                      {song.capabilities.lyrics ? <Text style={styles.scoreOnlyText}>LYRICS</Text> : null}
                    </View>
                  )}

                  {song.capabilities.lyrics ? (
                    <View pointerEvents="none" style={styles.lyricLane}>
                      {layouts.filter((layout) => layout.note.lyric).map((layout) => (
                        <Text key={`lyric-${layout.note.id}`} style={[styles.lyric, { left: layout.center - 22 }]} numberOfLines={1}>{layout.note.lyric}</Text>
                      ))}
                    </View>
                  ) : null}

                  <View pointerEvents="none" style={styles.measureRule} />
                </Pressable>
              );
            })}
            <View pointerEvents="none" style={[styles.playhead, { left: playheadLeft }]}><View style={styles.playheadCap} /></View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.scoreFooter}><Text style={[type.mono, styles.measureReadout]}>M{String((currentMeasure?.index ?? 0) + 1).padStart(2, '0')}</Text></View>
    </View>
  );
}

function buildMeasureSpacing(measure: PlaybackMeasure, notes: PlaybackNote[]): MeasureSpacing {
  const measureEnd = Math.max(measure.start + measure.duration, measure.start + 0.01);
  const eventStarts = [
    measure.start,
    measureEnd,
    ...measure.beats.map((beat) => beat.start),
    ...notes.map((note) => note.start),
  ]
    .map((start) => Math.min(measureEnd, Math.max(measure.start, start)))
    .sort((a, b) => a - b)
    .filter((start, index, values) => index === 0 || start - values[index - 1] > 0.005);

  const baseUsableWidth = BASE_MEASURE_WIDTH - MEASURE_HORIZONTAL_PADDING * 2;
  if (eventStarts.length < 2) {
    return {
      starts: [measure.start, measureEnd],
      positions: [MEASURE_HORIZONTAL_PADDING, BASE_MEASURE_WIDTH - MEASURE_HORIZONTAL_PADDING],
      width: BASE_MEASURE_WIDTH,
    };
  }

  const rawGaps = eventStarts.slice(1).map((start, index) => Math.max(0.001, start - eventStarts[index]));
  const weights = rawGaps.map((gap) => Math.pow(gap, EVENT_SPACING_EXPONENT));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const gapCount = rawGaps.length;
  const usableWidth = Math.max(baseUsableWidth, MIN_EVENT_GAP * gapCount);
  const remainingWidth = Math.max(0, usableWidth - MIN_EVENT_GAP * gapCount);
  const gaps = weights.map((weight) => MIN_EVENT_GAP + (weight / weightTotal) * remainingWidth);
  const positions = [MEASURE_HORIZONTAL_PADDING];
  gaps.forEach((gap) => positions.push((positions.at(-1) ?? MEASURE_HORIZONTAL_PADDING) + gap));

  return {
    starts: eventStarts,
    positions,
    width: usableWidth + MEASURE_HORIZONTAL_PADDING * 2,
  };
}

function xForTime(time: number, measure: PlaybackMeasure, spacing: MeasureSpacing): number {
  const measureEnd = Math.max(measure.start + measure.duration, measure.start + 0.01);
  const clamped = Math.min(measureEnd, Math.max(measure.start, time));
  if (clamped <= spacing.starts[0]) return spacing.positions[0];

  for (let index = 0; index < spacing.starts.length - 1; index += 1) {
    const start = spacing.starts[index];
    const end = spacing.starts[index + 1];
    if (clamped <= end) {
      const fraction = (clamped - start) / Math.max(end - start, 0.001);
      return spacing.positions[index] + fraction * (spacing.positions[index + 1] - spacing.positions[index]);
    }
  }

  return spacing.positions.at(-1) ?? spacing.width - MEASURE_HORIZONTAL_PADDING;
}

function layoutForNote(note: PlaybackNote, measure: PlaybackMeasure, spacing: MeasureSpacing): NoteLayout {
  const center = xForTime(note.start, measure, spacing);
  const left = center - NOTE_WIDTH / 2;
  const stringIndex = Math.min(5, Math.max(0, note.stringNumber));
  const tabLine = TAB_LINE_TOP + stringIndex * TAB_LINE_GAP;
  const staffTop = staffYForMidi(note.midi);
  return { note, left, center, staffTop, tabTop: tabLine - 8, tabLine };
}

function staffYForMidi(midi: number): number {
  const middleLine = STAFF_LINE_TOP + STAFF_LINE_GAP * 2;
  return Math.max(STAFF_LINE_TOP - 24, Math.min(STAFF_LINE_TOP + STAFF_LINE_GAP * 4 + 24, middleLine - (midi - 71) * 1.65));
}

function buildRelations(notes: PlaybackNote[], measure: PlaybackMeasure, spacing: MeasureSpacing): Relation[] {
  const sorted = [...notes].sort((a, b) => a.start - b.start);
  const relations: Relation[] = [];

  const nextByString = new Map<number, PlaybackNote>();
  let index = sorted.length - 1;
  while (index >= 0) {
    const groupEnd = index;
    const groupStartTime = sorted[index].start;
    while (index >= 0 && Math.abs(sorted[index].start - groupStartTime) <= 0.001) index -= 1;

    for (let groupIndex = groupEnd; groupIndex > index; groupIndex -= 1) {
      const note = sorted[groupIndex];
      const next = nextByString.get(note.stringNumber);
      const start = layoutForNote(note, measure, spacing);
      const end = next ? layoutForNote(next, measure, spacing) : null;
      const width = end ? Math.max(10, end.center - start.center) : Math.max(12, spacing.width - start.center - MEASURE_HORIZONTAL_PADDING);

      if (note.techniques.includes('hammer-on') || note.techniques.includes('pull-off') || note.techniques.includes('tie')) {
        relations.push({ kind: 'slur', layer: 'staff', left: start.center, width, top: Math.min(start.staffTop, end?.staffTop ?? start.staffTop) - 14 });
      }
      if (note.techniques.includes('bend')) {
        relations.push({ kind: 'bend', layer: 'staff', left: start.center, width, top: Math.min(start.staffTop, end?.staffTop ?? start.staffTop) - 26 });
      }
      if (note.techniques.includes('vibrato')) {
        relations.push({ kind: 'vibrato', layer: 'staff', left: start.center, width, top: Math.min(start.staffTop, end?.staffTop ?? start.staffTop) - 22 });
      }
      if (note.techniques.includes('slide')) {
        relations.push({ kind: 'slide', layer: 'tab', left: start.center, width, top: start.tabLine - 11 });
      }
      if (note.techniques.includes('let-ring')) {
        relations.push({ kind: 'sustain', layer: 'tab', left: start.center, width, top: start.tabLine + 9 });
      }
      if (note.techniques.includes('palm-mute')) {
        relations.push({ kind: 'mute', layer: 'tab', left: start.center - 2, width: Math.min(width, 28), top: start.tabLine - 15 });
      }
    }

    for (let groupIndex = index + 1; groupIndex <= groupEnd; groupIndex += 1) {
      const note = sorted[groupIndex];
      nextByString.set(note.stringNumber, note);
    }
  }

  return relations;
}

function renderBeatOverlay(beat: PlaybackMeasure['beats'][number], measure: PlaybackMeasure, spacing: MeasureSpacing, notes: PlaybackNote[]) {
  const beatNotes = notes.filter((note) => Math.abs(note.start - beat.start) < 0.01);
  const left = xForTime(beat.start, measure, spacing) - NOTE_WIDTH / 2 - 5;
  return (
    <React.Fragment key={`beat-${beat.index}`}>
      {beat.isRest && !beatNotes.length ? (
        <View style={[styles.restWrap, { left }]}>
          <RestMark />
        </View>
      ) : null}
      {beat.tuplet ? <Text style={[styles.rhythmMark, { left: left + 4 }]}>{beat.tuplet.num}</Text> : null}
      {beat.dotted ? <View style={[styles.rhythmDot, { left: left + 13 }]} /> : null}
    </React.Fragment>
  );
}

function RestMark() {
  return (
    <View style={styles.restIcon}>
      <View style={styles.restStrokeOne} />
      <View style={styles.restStrokeTwo} />
      <View style={styles.restStrokeThree} />
      <View style={styles.restDot} />
    </View>
  );
}

function StaffNote({ layout, position }: { layout: NoteLayout; position: number }) {
  const playing = position >= layout.note.start && position < layout.note.start + layout.note.duration;
  return (
    <View style={[styles.staffNote, { left: layout.center - 5, top: layout.staffTop - 3 }]}>
      <View style={[styles.noteHead, playing && styles.noteHeadPlaying]} />
      <View style={[styles.noteStem, playing && styles.noteStemPlaying]} />
      {layout.note.duration < 0.5 ? <View style={[styles.noteFlag, playing && styles.noteStemPlaying]} /> : null}
      {layout.note.dynamic ? <Text style={styles.dynamic}>{layout.note.dynamic}</Text> : null}
    </View>
  );
}

function TabNote({ layout, position }: { layout: NoteLayout; position: number }) {
  const playing = position >= layout.note.start && position < layout.note.start + layout.note.duration;
  const harmonic = layout.note.techniques.includes('harmonic');
  return (
    <View style={[styles.tabNote, { left: layout.left, top: layout.tabTop }, playing && styles.tabNotePlaying, harmonic && styles.harmonicNote]}>
      <Text style={[styles.fret, playing && styles.playingText]}>{noteGlyph(layout.note)}</Text>
      {layout.note.techniques.includes('accent') ? <View style={[styles.accentMark, playing && styles.playingAccent]} /> : null}
    </View>
  );
}

function noteGlyph(note: PlaybackNote): string {
  if (note.techniques.includes('mute')) return 'x';
  return String(note.fret);
}

function RelationMark({ relation }: { relation: Relation }) {
  if (relation.kind === 'slide') {
    return <View pointerEvents="none" style={[styles.relation, { left: relation.left, top: relation.top, width: relation.width }]}><View style={styles.slideLine} /><View style={styles.slideArrow} /></View>;
  }
  if (relation.kind === 'vibrato') {
    const count = Math.max(2, Math.floor(relation.width / 8));
    return <View pointerEvents="none" style={[styles.relation, { left: relation.left, top: relation.top, width: relation.width }]}>{Array.from({ length: count }, (_, index) => <View key={index} style={[styles.vibratoStroke, { left: index * 8, transform: [{ rotate: index % 2 ? '-25deg' : '25deg' }] }]} />)}</View>;
  }
  if (relation.kind === 'sustain') return <View pointerEvents="none" style={[styles.relation, styles.sustain, { left: relation.left, top: relation.top, width: relation.width }]} />;
  if (relation.kind === 'mute') return <View pointerEvents="none" style={[styles.relation, styles.muteLine, { left: relation.left, top: relation.top, width: relation.width }]} />;
  return (
    <View pointerEvents="none" style={[styles.relation, { left: relation.left, top: relation.top, width: relation.width }]}>
      <View style={[styles.slur, relation.kind === 'bend' && styles.bendSlur]} />
      {relation.kind === 'bend' ? <View style={styles.bendArrow} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.rule, borderRadius: 16, marginTop: 14, overflow: 'hidden' },
  scoreHeader: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackName: { color: colors.muted, fontSize: 12, marginTop: 3 },
  timeReadout: { flexDirection: 'row', alignItems: 'baseline' },
  currentTime: { color: colors.ink, fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  viewport: { height: SCORE_HEIGHT, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.rule, backgroundColor: colors.paper },
  content: { paddingHorizontal: 14 },
  timeline: { height: SCORE_HEIGHT, position: 'relative' },
  measure: { position: 'absolute', top: 0, bottom: 0, borderRightWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.paper },
  measureActive: { backgroundColor: colors.accentWash },
  measureHeader: { height: 28, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  measureRule: { position: 'absolute', top: 0, bottom: 0, right: -1, width: 1, backgroundColor: colors.ruleStrong },
  staffArea: { position: 'absolute', left: 8, right: 8, top: 0, height: STAFF_AREA_HEIGHT },
  staffLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.ruleStrong },
  staffNote: { position: 'absolute', width: 12, height: 16, zIndex: 3 },
  noteHead: { position: 'absolute', top: 4, left: 1, width: 9, height: 6, borderRadius: 6, backgroundColor: colors.ink, transform: [{ rotate: '-18deg' }] },
  noteHeadPlaying: { backgroundColor: colors.accentBright },
  noteStem: { position: 'absolute', top: -4, right: 1, width: 1, height: 12, backgroundColor: colors.ink },
  noteStemPlaying: { backgroundColor: colors.accentBright },
  noteFlag: { position: 'absolute', top: -4, right: -2, width: 6, height: 4, borderTopWidth: 1, borderRightWidth: 1, borderTopRightRadius: 5, borderColor: colors.ink, transform: [{ rotate: '18deg' }] },
  tabArea: { position: 'absolute', left: 8, right: 8, top: TAB_AREA_TOP, height: SCORE_HEIGHT - TAB_AREA_TOP },
  scoreOnlyFooter: { position: 'absolute', left: 8, right: 8, top: TAB_AREA_TOP + 16, height: SCORE_HEIGHT - TAB_AREA_TOP - 16, borderTopWidth: 1, borderColor: colors.rule, alignItems: 'center', justifyContent: 'center', gap: 8 },
  scoreOnlyText: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  lyricLane: { position: 'absolute', left: 8, right: 8, bottom: 8, height: 28, zIndex: 6 },
  lyric: { position: 'absolute', width: 44, color: colors.muted, fontSize: 10, lineHeight: 14, textAlign: 'center' },
  dynamic: { position: 'absolute', left: -6, top: -18, color: colors.accentBright, fontSize: 9, fontStyle: 'italic', fontWeight: '800' },
  tabLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.ruleStrong },
  tabNote: { position: 'absolute', width: NOTE_WIDTH, height: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, zIndex: 4 },
  tabNotePlaying: { backgroundColor: colors.accent, borderRadius: 4, transform: [{ scale: 1.08 }] },
  harmonicNote: { borderWidth: 1, borderColor: colors.muted, borderRadius: NOTE_WIDTH / 2 },
  fret: { color: colors.ink, fontSize: 13, lineHeight: 14, fontWeight: '800' },
  playingText: { color: colors.accentInk },
  accentMark: { position: 'absolute', top: -6, width: 0, height: 0, borderLeftWidth: 3, borderRightWidth: 3, borderBottomWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.accentBright },
  playingAccent: { borderBottomColor: colors.accentInk },
  restWrap: { position: 'absolute', top: 72, width: 28, alignItems: 'center', zIndex: 2 },
  restIcon: { width: 18, height: 28, position: 'relative' },
  restStrokeOne: { position: 'absolute', top: 3, left: 6, width: 9, height: 2, backgroundColor: colors.muted, transform: [{ rotate: '35deg' }] },
  restStrokeTwo: { position: 'absolute', top: 10, left: 3, width: 10, height: 2, backgroundColor: colors.muted, transform: [{ rotate: '-35deg' }] },
  restStrokeThree: { position: 'absolute', top: 17, left: 6, width: 9, height: 2, backgroundColor: colors.muted, transform: [{ rotate: '35deg' }] },
  restDot: { position: 'absolute', bottom: 1, left: 8, width: 3, height: 3, borderRadius: 3, backgroundColor: colors.muted },
  rhythmMark: { position: 'absolute', top: 35, color: colors.neutral, fontSize: 8, lineHeight: 9, fontWeight: '700' },
  rhythmDot: { position: 'absolute', top: 38, width: 3, height: 3, borderRadius: 3, backgroundColor: colors.neutral },
  relation: { position: 'absolute', height: 18, zIndex: 2 },
  slur: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 11, borderTopWidth: 1, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderTopColor: colors.muted },
  bendSlur: { borderTopColor: colors.accentBright },
  slideLine: { position: 'absolute', left: 0, right: 0, top: 8, height: 1, backgroundColor: colors.muted, transform: [{ rotate: '-14deg' }] },
  slideArrow: { position: 'absolute', right: -1, top: 5, width: 5, height: 5, borderRightWidth: 1, borderTopWidth: 1, borderColor: colors.muted, transform: [{ rotate: '45deg' }] },
  bendArrow: { position: 'absolute', right: -1, top: 4, width: 5, height: 5, borderRightWidth: 1, borderTopWidth: 1, borderColor: colors.accentBright, transform: [{ rotate: '45deg' }] },
  sustain: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: colors.muted },
  muteLine: { height: 1, borderTopWidth: 1, borderTopColor: colors.accentBright },
  vibratoStroke: { position: 'absolute', top: 8, width: 6, height: 1, backgroundColor: colors.muted },
  playhead: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.accentBright, zIndex: 8 },
  playheadCap: { position: 'absolute', top: 0, left: -5, width: 12, height: 7, backgroundColor: colors.accentBright },
  scoreFooter: { paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  activeText: { color: colors.accentBright },
  measureReadout: { color: colors.accentBright },
});
