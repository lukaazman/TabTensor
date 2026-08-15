import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ChordBoard } from '@/library/ChordBoard';
import { ALL_CHORDS, ChordDefinition } from '@/library/chords';
import { SCALE_CATALOG, SCALE_ROOTS, ScaleDefinition, ScaleGenre, scaleNotes } from '@/library/scales';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, layout, type } from '@/theme';
import { GuitarProSong, RecentFile } from '@/types';
import { forgetFile, loadRecentFiles, rememberFile } from '@/storage/recentFiles';
import { isFileAccessible } from '@/player/fileHandling';
import { parsePlayerFile } from '@/player/parser/PlayerParser';
import { formatOpenedAt } from '@/utils/format';

type LibrarySection = 'recent' | 'chords' | 'scales';

const SCALE_GENRES: ScaleGenre[] = ['POPULAR', 'BLUES / ROCK', 'JAZZ / FUNK', 'METAL / FLAMENCO', 'WORLD'];

export function LibraryScreen({ onOpenSong }: { onOpenSong: (song: GuitarProSong) => void }) {
  const { width } = useWindowDimensions();
  const carouselWidth = Math.max(232, width - 72);
  const [expanded, setExpanded] = useState<LibrarySection | null>('recent');
  const [recent, setRecent] = useState<RecentFile[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chordIndex, setChordIndex] = useState(0);
  const [selectedScaleId, setSelectedScaleId] = useState<string | null>(null);
  const [scaleRootIndex, setScaleRootIndex] = useState(0);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const chordListRef = useRef<FlatList<ChordDefinition> | null>(null);

  useEffect(() => {
    let mounted = true;
    loadRecentFiles()
      .then((files) => {
        if (mounted) setRecent(files);
      })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : 'Could not load recent files.');
      })
      .finally(() => {
        if (mounted) setLoadingRecent(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const openRecent = async (file: RecentFile) => {
    setLoadingId(file.id);
    setError(null);
    try {
      if (!(await isFileAccessible(file.uri))) {
        throw new Error('This file is no longer available. Remove it and open the source file again.');
      }
      const song = await parsePlayerFile(file.uri, file.name);
      const next = await rememberFile({ ...file, title: song.title, artist: song.artist, openedAt: Date.now() });
      setRecent(next);
      onOpenSong(song);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not reopen this file.');
    } finally {
      setLoadingId(null);
    }
  };

  const removeRecent = async (file: RecentFile) => {
    setError(null);
    try {
      setRecent(await forgetFile(file.id));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not remove this file.');
    }
  };

  const goToChord = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(ALL_CHORDS.length - 1, nextIndex));
    setChordIndex(safeIndex);
    chordListRef.current?.scrollToOffset({ offset: safeIndex * carouselWidth, animated: true });
  };

  const selectedScale = selectedScaleId ? SCALE_CATALOG.find((scale) => scale.id === selectedScaleId) ?? null : null;
  const selectedScaleNotes = selectedScale ? scaleNotes(scaleRootIndex, selectedScale.intervals) : [];

  return (
    <ScreenShell contentStyle={styles.screenContent}>
      <View style={styles.brandRow}>
        <View style={styles.brandLockup}><View style={styles.brandMark} /><Text style={styles.brand}>TABTENSOR</Text></View>
        <View style={styles.localChip}><View style={styles.localDot} /><Text style={type.mono}>LOCAL</Text></View>
      </View>

      <SectionHeader eyebrow="03 / LIBRARY" title="Guitar library" detail="LOCAL REFERENCE · ALWAYS READY" />
      <Text style={[type.caption, styles.intro]}>A compact workbench for your files, voicings and scale ideas. Tap a section to reveal its tools.</Text>

      <View style={styles.sectionStack}>
        <CollectionSectionButton
          number="01"
          title="Recent files"
          detail={recent.length === 0 ? 'PLAYER HISTORY · EMPTY' : `${recent.length} PLAYER FILE${recent.length === 1 ? '' : 'S'}`}
          expanded={expanded === 'recent'}
          onPress={() => setExpanded(expanded === 'recent' ? null : 'recent')}
        />
        {expanded === 'recent' ? (
          <RecentPanel
            recent={recent}
            loading={loadingRecent}
            loadingId={loadingId}
            onOpen={openRecent}
            onRemove={removeRecent}
          />
        ) : null}

        <CollectionSectionButton
          number="02"
          title="Chord collection"
          detail={`${ALL_CHORDS.length} VOICINGS · CHROMATIC ORDER`}
          expanded={expanded === 'chords'}
          onPress={() => setExpanded(expanded === 'chords' ? null : 'chords')}
        />
        {expanded === 'chords' ? (
          <View style={styles.collectionPanel}>
            <View style={styles.panelIntro}>
              <Text style={type.body}>Slide through the chord index</Text>
              <Text style={type.caption}>Every root is grouped chromatically, from C through B. Use the arrows or swipe the title and board.</Text>
            </View>
            <View style={styles.chordControls}>
              <ActionButton variant="quiet" accessibilityLabel="Previous chord" disabled={chordIndex === 0} onPress={() => goToChord(chordIndex - 1)}>‹ PREV</ActionButton>
              <Text style={[type.mono, styles.indexReadout]}>{String(chordIndex + 1).padStart(3, '0')} / {String(ALL_CHORDS.length).padStart(3, '0')}</Text>
              <ActionButton variant="quiet" accessibilityLabel="Next chord" disabled={chordIndex === ALL_CHORDS.length - 1} onPress={() => goToChord(chordIndex + 1)}>NEXT ›</ActionButton>
            </View>
            <FlatList
              ref={chordListRef}
              data={ALL_CHORDS}
              initialScrollIndex={chordIndex}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              getItemLayout={(_, index) => ({ length: carouselWidth, offset: carouselWidth * index, index })}
              renderItem={({ item, index }: ListRenderItemInfo<ChordDefinition>) => (
                <View style={[styles.chordPage, { width: carouselWidth }]}>
                  <View style={styles.chordTitleBlock}>
                    <Text style={styles.chordName}>{item.name}</Text>
                    <Text style={[type.mono, styles.chordQuality]}>{item.qualityId.replace(/-/g, ' ').toUpperCase()}</Text>
                  </View>
                  <ChordBoard chord={item} />
                  <View style={styles.chordInfo}>
                    <View style={styles.infoLine}><Text style={type.section}>FORMULA</Text><Text style={[type.mono, styles.infoValue]}>{item.formula}</Text></View>
                    <Text style={type.caption}>{item.description}</Text>
                  </View>
                  <Text style={[type.mono, styles.pageFooter]}>CHROMATIC INDEX · {String(Math.floor(index / 28) + 1).padStart(2, '0')} / 12 ROOTS</Text>
                </View>
              )}
              onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                const next = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
                setChordIndex(Math.max(0, Math.min(ALL_CHORDS.length - 1, next)));
              }}
              onScrollToIndexFailed={({ index }) => {
                setTimeout(() => chordListRef.current?.scrollToOffset({ offset: index * carouselWidth, animated: true }), 60);
              }}
            />
          </View>
        ) : null}

        <CollectionSectionButton
          number="03"
          title="Scale collection"
          detail={`${SCALE_CATALOG.length} POPULAR + GENRE MAPS`}
          expanded={expanded === 'scales'}
          onPress={() => setExpanded(expanded === 'scales' ? null : 'scales')}
        />
        {expanded === 'scales' ? (
          <View style={styles.collectionPanel}>
            <View style={styles.panelIntro}>
              <Text style={type.body}>Choose a scale to reveal it</Text>
              <Text style={type.caption}>Start with the popular set, then explore genre-specific colors for writing and improvising.</Text>
            </View>
            <View style={styles.scaleGroups}>
              {SCALE_GENRES.map((genre) => {
                const scales = SCALE_CATALOG.filter((scale) => scale.genre === genre);
                if (scales.length === 0) return null;
                return (
                  <View key={genre} style={styles.scaleGroup}>
                    <Text style={type.section}>{genre}</Text>
                    {scales.map((scale) => (
                      <Pressable
                        key={scale.id}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: selectedScaleId === scale.id }}
                        onPress={() => { setSelectedScaleId(selectedScaleId === scale.id ? null : scale.id); setSelectedNoteIndex(null); }}
                        style={({ pressed }) => [styles.scaleRow, selectedScaleId === scale.id && styles.scaleRowSelected, pressed && styles.pressed]}
                      >
                        <View style={[styles.scaleRowMarker, selectedScaleId === scale.id && styles.scaleRowMarkerSelected]} />
                        <View style={styles.scaleRowCopy}>
                          <Text style={type.body}>{scale.name}</Text>
                          <Text style={type.caption}>{scale.use}</Text>
                        </View>
                        <Text style={[type.mono, styles.scaleRowCount]}>{scale.intervals.length}N</Text>
                        <Text style={styles.rowChevron}>{selectedScaleId === scale.id ? '−' : '+'}</Text>
                      </Pressable>
                    ))}
                  </View>
                );
              })}
            </View>
            {selectedScale ? (
              <ScaleViewer
                scale={selectedScale}
                rootIndex={scaleRootIndex}
                notes={selectedScaleNotes}
                selectedNoteIndex={selectedNoteIndex}
                onRootChange={(index) => { setScaleRootIndex(index); setSelectedNoteIndex(null); }}
                onNoteSelect={setSelectedNoteIndex}
              />
            ) : (
              <View style={styles.scalePrompt}><Text style={styles.emptyMark}>⌁</Text><Text style={type.body}>No scale selected</Text><Text style={type.caption}>Tap any scale above to open its player view.</Text></View>
            )}
          </View>
        ) : null}
      </View>

      {error ? <View style={styles.error}><Text style={[type.section, styles.errorTitle]}>LIBRARY MESSAGE</Text><Text style={type.caption}>{error}</Text></View> : null}
      <View style={styles.privacy}><Text style={type.section}>DEVICE ONLY</Text><Text style={type.caption}>Recent file references stay on this device. Opening a file hands it to the same player used by the Player tab.</Text></View>
    </ScreenShell>
  );
}

function CollectionSectionButton({ number, title, detail, expanded, onPress }: { number: string; title: string; detail: string; expanded: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [styles.collectionButton, expanded && styles.collectionButtonExpanded, pressed && styles.pressed]}
    >
      <View style={[styles.collectionNumber, expanded && styles.collectionNumberExpanded]}><Text style={[type.mono, styles.collectionNumberText, expanded && styles.collectionNumberTextExpanded]}>{number}</Text></View>
      <View style={styles.collectionCopy}><Text style={type.section}>{title.toUpperCase()}</Text><Text style={type.caption}>{detail}</Text></View>
      <Text style={[styles.collectionChevron, expanded && styles.collectionChevronExpanded]}>{expanded ? '−' : '+'}</Text>
    </Pressable>
  );
}

function RecentPanel({ recent, loading, loadingId, onOpen, onRemove }: { recent: RecentFile[]; loading: boolean; loadingId: string | null; onOpen: (file: RecentFile) => void; onRemove: (file: RecentFile) => void }) {
  if (loading) {
    return <View style={styles.loadingPanel}><ActivityIndicator color={colors.accentBright} /><Text style={type.caption}>Reading local player history…</Text></View>;
  }
  if (recent.length === 0) {
    return <View style={styles.emptyPanel}><Text style={styles.emptyMark}>—</Text><Text style={type.body}>No files opened yet.</Text><Text style={type.caption}>Import or open a song in Player and it will appear here too.</Text></View>;
  }
  return (
    <View style={styles.recentPanel}>
      <View style={styles.panelIntro}><Text style={type.body}>Open from your player history</Text><Text style={type.caption}>Tap a file to return directly to the player. The source remains local to this device.</Text></View>
      {recent.map((file) => (
        <View key={file.id} style={styles.fileRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${file.title || file.name} in player`} onPress={() => onOpen(file)} style={({ pressed }) => [styles.fileMain, pressed && styles.pressed]}>
            <View style={styles.fileIcon}><Text style={[type.mono, styles.fileIconText]}>{file.format.toUpperCase()}</Text></View>
            <View style={styles.fileCopy}><Text style={type.body} numberOfLines={1}>{file.title || file.name}</Text><Text style={type.caption} numberOfLines={1}>{file.artist || file.name} · {formatOpenedAt(file.openedAt)}</Text></View>
          </Pressable>
          {loadingId === file.id ? <ActivityIndicator color={colors.accentBright} /> : <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${file.name} from recent files`} onPress={() => onRemove(file)} hitSlop={6} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}><Text style={type.mono}>×</Text></Pressable>}
        </View>
      ))}
    </View>
  );
}

function ScaleViewer({ scale, rootIndex, notes, selectedNoteIndex, onRootChange, onNoteSelect }: { scale: ScaleDefinition; rootIndex: number; notes: string[]; selectedNoteIndex: number | null; onRootChange: (index: number) => void; onNoteSelect: (index: number) => void }) {
  const activeIndex = selectedNoteIndex ?? 0;
  return (
    <View style={styles.scaleViewer}>
      <View style={styles.scaleViewerHeader}>
        <View><Text style={styles.scaleTitle}>{SCALE_ROOTS[rootIndex]} {scale.name}</Text><Text style={[type.mono, styles.scaleGenre]}>{scale.genre} · {notes.length} NOTES</Text></View>
        <View style={styles.scaleRootBadge}><Text style={styles.scaleRootBadgeText}>{SCALE_ROOTS[rootIndex]}</Text></View>
      </View>
      <Text style={[type.caption, styles.scaleDescription]}>{scale.description}</Text>
      <Text style={type.section}>ROOT NOTE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rootChips}>
        {SCALE_ROOTS.map((root, index) => (
          <Pressable key={root} accessibilityRole="button" accessibilityState={{ selected: rootIndex === index }} onPress={() => onRootChange(index)} style={({ pressed }) => [styles.rootChip, rootIndex === index && styles.rootChipSelected, pressed && styles.pressed]}>
            <Text style={[type.mono, styles.rootChipText, rootIndex === index && styles.rootChipTextSelected]}>{root}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.scalePlayerBar}>
        <View><Text style={type.section}>SCALE PLAYER</Text><Text style={type.caption}>Tap a note to spotlight its degree.</Text></View>
        <Text style={[type.mono, styles.scalePosition]}>{String(activeIndex + 1).padStart(2, '0')} / {String(notes.length).padStart(2, '0')}</Text>
      </View>
      <View style={styles.noteTrack}>
        <View style={styles.noteTrackLine} />
        {notes.map((note, index) => (
          <Pressable key={`${note}-${index}`} accessibilityRole="button" accessibilityLabel={`${note}, degree ${scale.degrees[index]}`} onPress={() => onNoteSelect(index)} style={({ pressed }) => [styles.noteCard, selectedNoteIndex === index && styles.noteCardSelected, pressed && styles.pressed]}>
            <Text style={[type.mono, styles.noteDegree, selectedNoteIndex === index && styles.noteDegreeSelected]}>{scale.degrees[index]}</Text>
            <Text style={[styles.noteName, selectedNoteIndex === index && styles.noteNameSelected]}>{note}</Text>
            <Text style={[type.caption, styles.noteStep]}>{index === 0 ? 'ROOT' : `+${scale.intervals[index] - scale.intervals[index - 1]} ST`}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.scaleMeta}>
        <View style={styles.metaBlock}><Text style={type.section}>FORMULA</Text><Text style={[type.mono, styles.metaValue]}>{scale.formula}</Text></View>
        <View style={styles.metaBlock}><Text style={type.section}>BEST IN</Text><Text style={[type.caption, styles.metaValue]}>{scale.use}</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: 42 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 10, height: 10, borderRadius: 3, backgroundColor: colors.accent },
  brand: { color: colors.ink, fontSize: 13, fontWeight: '800', letterSpacing: 2.4 },
  localChip: { minHeight: 30, paddingHorizontal: 10, borderRadius: layout.radiusPill, borderWidth: 1, borderColor: colors.rule, flexDirection: 'row', alignItems: 'center', gap: 6 },
  localDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  intro: { marginTop: -10, marginBottom: 20 },
  sectionStack: { gap: 10 },
  collectionButton: { minHeight: 72, padding: 12, borderRadius: layout.radiusCard, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.paperRaised, flexDirection: 'row', alignItems: 'center', gap: 12 },
  collectionButtonExpanded: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  collectionNumber: { width: 40, height: 40, borderRadius: layout.radiusControl, backgroundColor: colors.paperSoft, alignItems: 'center', justifyContent: 'center' },
  collectionNumberExpanded: { backgroundColor: colors.accent },
  collectionNumberText: { color: colors.accentBright },
  collectionNumberTextExpanded: { color: colors.accentInk },
  collectionCopy: { flex: 1, minWidth: 0, gap: 3 },
  collectionChevron: { color: colors.inkMuted, fontSize: 25, lineHeight: 28, paddingHorizontal: 6 },
  collectionChevronExpanded: { color: colors.accentBright },
  collectionPanel: { padding: 16, borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusCard, backgroundColor: colors.paperRaised, gap: 14 },
  panelIntro: { gap: 5 },
  loadingPanel: { minHeight: 126, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusCard, backgroundColor: colors.paperRaised },
  emptyPanel: { minHeight: 160, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusCard, backgroundColor: colors.paperRaised },
  emptyMark: { color: colors.neutral, fontSize: 32 },
  recentPanel: { paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusCard, backgroundColor: colors.paperRaised },
  fileRow: { minHeight: 76, borderTopWidth: 1, borderColor: colors.rule, flexDirection: 'row', alignItems: 'center', gap: 9 },
  fileMain: { flex: 1, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileIcon: { width: 54, height: 38, borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusControl, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  fileIconText: { color: colors.accentBright, fontSize: 8, letterSpacing: 0.2 },
  fileCopy: { flex: 1, minWidth: 0, gap: 3 },
  removeButton: { width: 44, height: 44, borderRadius: layout.radiusControl, alignItems: 'center', justifyContent: 'center' },
  chordList: { height: 600, flexGrow: 0 },
  chordControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  indexReadout: { color: colors.accentBright, fontSize: 10 },
  chordPage: { alignItems: 'stretch', gap: 12 },
  chordTitleBlock: { alignItems: 'center', paddingVertical: 4, gap: 2 },
  chordName: { color: colors.ink, fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1 },
  chordQuality: { color: colors.accentBright, fontSize: 9, letterSpacing: 1.2 },
  chordInfo: { padding: 12, borderLeftWidth: 2, borderLeftColor: colors.accent, backgroundColor: colors.paper, gap: 8 },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  infoValue: { color: colors.ink, fontSize: 10 },
  pageFooter: { color: colors.neutral, fontSize: 9, textAlign: 'center' },
  scaleGroups: { gap: 18 },
  scaleGroup: { gap: 7 },
  scaleRow: { minHeight: 62, paddingHorizontal: 10, borderTopWidth: 1, borderColor: colors.rule, flexDirection: 'row', alignItems: 'center', gap: 10 },
  scaleRowSelected: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 7, backgroundColor: colors.paper },
  scaleRowMarker: { width: 7, height: 7, borderRadius: 2, backgroundColor: colors.ruleStrong },
  scaleRowMarkerSelected: { backgroundColor: colors.accentBright },
  scaleRowCopy: { flex: 1, minWidth: 0, gap: 2 },
  scaleRowCount: { color: colors.muted, fontSize: 9 },
  rowChevron: { width: 24, color: colors.accentBright, fontSize: 22, textAlign: 'center' },
  scalePrompt: { minHeight: 142, alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusControl, backgroundColor: colors.paper },
  scaleViewer: { marginTop: 2, padding: 14, borderWidth: 1, borderColor: colors.accent, borderRadius: layout.radiusCard, backgroundColor: colors.accentWash, gap: 12 },
  scaleViewerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  scaleTitle: { color: colors.ink, fontSize: 23, lineHeight: 28, fontWeight: '800' },
  scaleGenre: { color: colors.accentBright, fontSize: 9, marginTop: 3 },
  scaleRootBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  scaleRootBadgeText: { color: colors.accentInk, fontSize: 18, fontWeight: '800' },
  scaleDescription: { color: colors.inkMuted },
  rootChips: { gap: 7, paddingTop: 8, paddingBottom: 2 },
  rootChip: { minWidth: 44, height: 44, paddingHorizontal: 10, borderRadius: layout.radiusControl, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.paperRaised, alignItems: 'center', justifyContent: 'center' },
  rootChipSelected: { borderColor: colors.accentBright, backgroundColor: colors.accent },
  rootChipText: { color: colors.inkMuted, fontSize: 11 },
  rootChipTextSelected: { color: colors.accentInk },
  scalePlayerBar: { minHeight: 54, paddingVertical: 9, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.rule, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  scalePosition: { color: colors.accentBright },
  noteTrack: { minHeight: 94, position: 'relative', flexDirection: 'row', alignItems: 'stretch', gap: 5, paddingTop: 9 },
  noteTrackLine: { position: 'absolute', top: 17, left: 0, right: 0, height: 1, backgroundColor: colors.ruleStrong },
  noteCard: { flex: 1, minWidth: 0, minHeight: 82, paddingVertical: 11, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusControl, backgroundColor: colors.paper },
  noteCardSelected: { borderColor: colors.accentBright, backgroundColor: colors.paperRaised, transform: [{ translateY: -4 }] },
  noteDegree: { color: colors.muted, fontSize: 8 },
  noteDegreeSelected: { color: colors.accentBright },
  noteName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  noteNameSelected: { color: colors.accentBright },
  noteStep: { fontSize: 8, color: colors.neutral },
  scaleMeta: { gap: 9, paddingTop: 4 },
  metaBlock: { gap: 5 },
  metaValue: { color: colors.ink, fontSize: 10 },
  error: { marginTop: 16, padding: 15, borderWidth: 1, borderColor: colors.accent, borderRadius: layout.radiusCard, backgroundColor: colors.accentWash, gap: 8 },
  errorTitle: { color: colors.accentBright },
  privacy: { marginTop: 28, paddingTop: 18, borderTopWidth: 1, borderColor: colors.rule, gap: 8 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
