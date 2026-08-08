import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { RangeSlider } from '@/components/RangeSlider';
import { ScreenShell } from '@/components/ScreenShell';
import { colors, type } from '@/theme';
import { GuitarProSong } from '@/types';
import { useGuitarProPlayer } from '@/player/hooks/useGuitarProPlayer';
import { ScoreView } from '@/player/components/ScoreView';
import { TrackRow } from '@/player/components/TrackRow';
import { TransportControls } from '@/player/components/TransportControls';

export function PlaybackScreen({ song, onBack }: { song: GuitarProSong; onBack: () => void }) {
  useKeepAwake('tabtensor-playback');
  const player = useGuitarProPlayer(song);
  const [selectedTrackId, setSelectedTrackId] = useState(song.tracks[0]?.id ?? '');
  const [tracksOpen, setTracksOpen] = useState(true);
  const selectedTrack = useMemo(
    () => player.snapshot.tracks.find((track) => track.id === selectedTrackId)
      ?? song.tracks.find((track) => track.id === selectedTrackId)
      ?? song.tracks[0],
    [player.snapshot.tracks, selectedTrackId, song.tracks],
  );

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to player files" onPress={onBack} style={styles.back}>
          <Text style={styles.backIcon}>{'<'}</Text>
          <Text style={type.mono}>FILES</Text>
        </Pressable>
        <Text style={type.mono}>{song.format}</Text>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={2}>{song.title}</Text>
        <Text style={type.caption}>
          {song.artist || 'Unknown artist'} - {song.tempo} BPM{song.timeSignature ? ` - ${song.timeSignature}` : ''}
        </Text>
      </View>

      {player.snapshot.error ? (
        <View style={styles.error}>
          <Text style={[type.section, styles.errorTitle]}>PLAYBACK NEEDS NATIVE AUDIO</Text>
          <Text style={type.caption}>{player.snapshot.error}</Text>
        </View>
      ) : null}

      <TransportControls
        position={player.snapshot.position}
        duration={song.duration}
        state={player.snapshot.state}
        speed={player.snapshot.speed}
        countIn={player.countIn}
        onToggleCountIn={() => player.setCountIn((current) => !current)}
        onPlay={() => void player.play()}
        onPause={() => void player.pause()}
        onStop={() => void player.stop()}
        onSeek={(position) => void player.seek(position)}
        onSpeed={(speed) => void player.setSpeed(speed)}
      />

      {selectedTrack ? (
        <ScoreView song={song} track={selectedTrack} position={player.snapshot.position} onSeek={(position) => void player.seek(position)} />
      ) : (
        <View style={styles.error}><Text style={type.caption}>No tracks detected.</Text></View>
      )}

      <View style={styles.mixerPanel}>
        <Pressable onPress={() => setTracksOpen((current) => !current)} style={styles.panelHeader}>
          <View>
            <Text style={type.section}>TRACKS</Text>
            <Text style={type.caption}>{selectedTrack?.name ?? 'No track selected'} - {player.snapshot.tracks.length || song.tracks.length} tracks</Text>
          </View>
          <Text style={styles.chevron}>{tracksOpen ? '-' : '+'}</Text>
        </Pressable>
        <View style={styles.master}>
          <RangeSlider
            label="MASTER VOLUME"
            valueLabel={`${Math.round(player.snapshot.masterVolume * 100)}%`}
            value={player.snapshot.masterVolume}
            onChange={(value) => void player.setMasterVolume(value)}
          />
        </View>
        {tracksOpen
          ? (player.snapshot.tracks.length ? player.snapshot.tracks : song.tracks).map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              selected={selectedTrackId === track.id}
              onSelect={() => setSelectedTrackId(track.id)}
              onMute={() => void player.setTrackMuted(track.id, !track.muted)}
              onVolume={(value) => void player.setTrackVolume(track.id, value)}
            />
          ))
          : null}
      </View>

      <Text style={[type.caption, styles.footerNote]}>Playback is generated locally from the parsed tablature. Notes are read-only.</Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingRight: 12 },
  backIcon: { color: colors.redBright, fontSize: 30, lineHeight: 34, fontWeight: '300' },
  titleBlock: { gap: 7 },
  title: { color: colors.white, fontSize: 30, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6 },
  error: { marginTop: 14, padding: 14, gap: 7, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.redDim },
  errorTitle: { color: colors.redBright },
  mixerPanel: { marginTop: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, padding: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 13 },
  chevron: { color: colors.redBright, fontSize: 24 },
  master: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 13, paddingBottom: 3 },
  footerNote: { marginTop: 18 },
});
