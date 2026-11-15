import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { ModalSheet } from '@/components/ModalSheet';
import { ScreenShell } from '@/components/ScreenShell';
import { colors, font, pressed, radius, size, type } from '@/theme';
import { GuitarProSong } from '@/types';
import { useGuitarProPlayer } from '@/player/hooks/useGuitarProPlayer';
import { ScoreView } from '@/player/components/ScoreView';
import { TrackRow } from '@/player/components/TrackRow';
import { TransportControls, TransportOptions } from '@/player/components/TransportControls';
import { FollowTabPanel, FollowTabSettings } from '@/player/components/FollowTabPanel';
import { useFollowTab } from '@/player/followTab/useFollowTab';
import { RangeSlider } from '@/components/RangeSlider';

export function PlaybackScreen({ song, onBack }: { song: GuitarProSong; onBack: () => void }) {
  useKeepAwake('tabtensor-playback');
  const player = useGuitarProPlayer(song);
  const [selectedTrackId, setSelectedTrackId] = useState(song.tracks[0]?.id ?? '');
  const [tracksOpen, setTracksOpen] = useState(false);
  const [transportOptionsOpen, setTransportOptionsOpen] = useState(false);
  const [followSettingsOpen, setFollowSettingsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const selectedTrack = useMemo(
    () =>
      player.snapshot.tracks.find((track) => track.id === selectedTrackId) ??
      song.tracks.find((track) => track.id === selectedTrackId) ??
      song.tracks[0],
    [player.snapshot.tracks, selectedTrackId, song.tracks],
  );

  const follow = useFollowTab({
    track: selectedTrack,
    position: player.snapshot.position,
    duration: song.duration,
    tempo: song.tempo,
    timeSignature: song.timeSignature,
    countIn: player.countIn,
    loopStart: player.loopEnabled ? player.loopStart : null,
    loopEnd: player.loopEnabled ? player.loopEnd : null,
    onSeek: player.seek,
  });
  const transportState = follow.enabled ? follow.transportState : player.snapshot.state;
  const toggleFollow = async () => {
    if (!follow.enabled && player.snapshot.state === 'playing') await player.pause();
    follow.toggle();
  };
  const handlePlay = () => {
    if (follow.enabled) void follow.resume();
    else void player.play();
  };
  const handlePause = () => {
    if (follow.enabled) void follow.pause();
    else void player.pause();
  };
  const handleStop = () => {
    if (follow.enabled) void follow.stop();
    void player.stop();
  };
  const handleSeek = (nextPosition: number) => {
    if (follow.enabled) void follow.seekTo(nextPosition);
    else void player.seek(nextPosition);
  };

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to player files"
          onPress={onBack}
          style={styles.back}
        >
          <Text style={styles.backIcon}>{'‹'}</Text>
          <Text style={type.section}>Files</Text>
        </Pressable>
        <View style={styles.topBarActions}>
          {!focusMode ? (
            <View style={styles.formatChip}>
              <Text style={type.meta}>{song.format}</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={focusMode ? 'Exit score focus mode' : 'Enter score focus mode'}
            accessibilityHint={
              focusMode ? 'Returns to the full playback view' : 'Shows the score-focused playback view'
            }
            accessibilityState={{ selected: focusMode }}
            onPress={() => setFocusMode((current) => !current)}
            style={({ pressed }) => [
              styles.focusButton,
              focusMode && styles.focusButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[type.meta, focusMode && styles.focusButtonTextActive]}>
              {focusMode ? 'Exit focus' : 'Focus'}
            </Text>
          </Pressable>
        </View>
      </View>

      {!focusMode ? (
        <>
          <View style={styles.titleBlock}>
            <Text style={[type.section, styles.nowPlaying]}>Now playing</Text>
            <Text style={styles.title} numberOfLines={2}>
              {song.title}
            </Text>
            <View style={styles.songMeta}>
              <Text style={type.caption}>{song.artist || 'Unknown artist'}</Text>
              <Text style={type.meta}>
                {song.tempo} BPM{song.timeSignature ? ` · ${song.timeSignature}` : ''}
              </Text>
            </View>
          </View>

          {song.formatKind !== 'guitar-pro' ? (
            <View style={styles.formatNote}>
              <Text style={[type.section, styles.formatNoteTitle]}>
                {song.formatKind === 'musicxml' ? 'MusicXML score' : 'MIDI sequence'}
              </Text>
              <Text style={type.caption}>
                {song.formatKind === 'musicxml'
                  ? 'Staff notation, dynamics, tempo changes and lyrics are kept where the file provides them.'
                  : 'Playback follows the MIDI sequence with its tempo map, instruments, velocity and percussion tracks.'}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {player.snapshot.error ? (
        <View style={styles.error}>
          <Text style={[type.section, styles.errorTitle]}>Playback needs native audio</Text>
          <Text style={type.caption}>{player.snapshot.error}</Text>
        </View>
      ) : null}

      {selectedTrack ? (
        <ScoreView
          song={song}
          track={selectedTrack}
          position={player.snapshot.position}
          onSeek={handleSeek}
          scrollToken={follow.enabled ? follow.advanceToken : 0}
        />
      ) : (
        <View style={styles.error}>
          <Text style={type.caption}>No tracks detected.</Text>
        </View>
      )}

      <TransportControls
        position={player.snapshot.position}
        duration={song.duration}
        state={transportState}
        speed={player.snapshot.speed}
        countIn={player.countIn}
        onToggleCountIn={() => player.setCountIn((current) => !current)}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onSeek={handleSeek}
        onSpeed={(speed) => void player.setSpeed(speed)}
        loopStart={player.loopStart}
        loopEnd={player.loopEnd}
        loopEnabled={player.loopEnabled}
        canLoop={player.canLoop}
        onSetLoopPoint={player.setLoopPoint}
        onToggleLoop={player.toggleLoop}
        onOpenOptions={() => setTransportOptionsOpen(true)}
      />

      <FollowTabPanel
        follow={follow}
        onToggle={toggleFollow}
        onOpenSettings={() => setFollowSettingsOpen(true)}
        showSettings={!focusMode}
      />

      {!focusMode ? (
        <View style={styles.mixerPanel}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${tracksOpen ? 'Collapse' : 'Expand'} tracks`}
            accessibilityState={{ expanded: tracksOpen }}
            onPress={() => setTracksOpen((current) => !current)}
            style={styles.panelHeader}
          >
            <View style={styles.panelHeaderCopy}>
              <Text style={type.section}>Tracks</Text>
              <Text style={type.caption}>
                {selectedTrack?.name ?? 'No track selected'} · {player.snapshot.tracks.length || song.tracks.length}{' '}
                tracks
              </Text>
            </View>
            <View style={styles.panelHeaderMeta}>
              <Text style={styles.panelMaster}>{Math.round(player.snapshot.masterVolume * 100)}% master</Text>
              <Text style={styles.chevron}>{tracksOpen ? '−' : '+'}</Text>
            </View>
          </Pressable>
          {tracksOpen ? (
            <>
              <View style={styles.master}>
                <RangeSlider
                  label="Master volume"
                  valueLabel={`${Math.round(player.snapshot.masterVolume * 100)}%`}
                  value={player.snapshot.masterVolume}
                  onChange={(value) => void player.setMasterVolume(value)}
                />
              </View>
              {(player.snapshot.tracks.length ? player.snapshot.tracks : song.tracks).map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  selected={selectedTrackId === track.id}
                  onSelect={() => setSelectedTrackId(track.id)}
                  onMute={() => void player.setTrackMuted(track.id, !track.muted)}
                  onVolume={(value) => void player.setTrackVolume(track.id, value)}
                />
              ))}
            </>
          ) : null}
        </View>
      ) : null}

      {!focusMode ? (
        <Text style={[type.caption, styles.footerNote]}>
          {song.formatKind === 'guitar-pro'
            ? 'Playback is generated locally from the parsed tablature. Notes are read-only.'
            : 'Playback is generated locally from the imported score or sequence. Source data is read-only.'}
        </Text>
      ) : null}

      <ModalSheet visible={transportOptionsOpen} onClose={() => setTransportOptionsOpen(false)}>
        <TransportOptions
          speed={player.snapshot.speed}
          countIn={player.countIn}
          onToggleCountIn={() => player.setCountIn((current) => !current)}
          onSpeed={(speed) => void player.setSpeed(speed)}
          loopStart={player.loopStart}
          loopEnd={player.loopEnd}
          loopEnabled={player.loopEnabled}
          canLoop={player.canLoop}
          onSetLoopPoint={player.setLoopPoint}
          onToggleLoop={player.toggleLoop}
        />
      </ModalSheet>

      <ModalSheet visible={followSettingsOpen} onClose={() => setFollowSettingsOpen(false)} scrollable>
        <FollowTabSettings follow={follow} />
      </ModalSheet>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingRight: 12 },
  backIcon: { color: colors.accent, fontSize: size.display, lineHeight: 36, fontFamily: font.regular },
  formatChip: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusButton: {
    minWidth: 74,
    minHeight: 44,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.control,
    borderRadius: radius.control,
  },
  focusButtonActive: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  focusButtonTextActive: { color: colors.accent },
  titleBlock: { gap: 8 },
  nowPlaying: { color: colors.accent },
  title: { color: colors.ink, fontSize: size.display, lineHeight: 36, fontFamily: font.semibold },
  songMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  formatNote: {
    marginTop: 14,
    paddingTop: 13,
    paddingBottom: 3,
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: radius.card,
    backgroundColor: colors.accentTint,
  },
  formatNoteTitle: { color: colors.accent },
  error: {
    marginTop: 14,
    padding: 16,
    gap: 8,
    borderRadius: radius.card,
    backgroundColor: colors.accentTint,
  },
  errorTitle: { color: colors.accent },
  mixerPanel: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: 16,
  },
  panelHeader: { minHeight: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  panelHeaderCopy: { flex: 1, minWidth: 0, gap: 3 },
  panelHeaderMeta: { alignItems: 'flex-end', gap: 2 },
  panelMaster: { color: colors.faint, fontFamily: font.mono, fontSize: size.meta },
  chevron: { color: colors.ink, fontSize: size.title, lineHeight: 32 },
  master: { borderTopWidth: 1, borderColor: colors.rule, paddingTop: 13, paddingBottom: 3 },
  footerNote: { marginTop: 18 },
  pressed,
});
