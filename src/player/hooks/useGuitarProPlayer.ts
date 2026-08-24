import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GuitarProSong, PlaybackSnapshot } from '@/types';
import { toUserFacingPlayerError } from '../playerError';
import { createPlaybackEngine } from '../playback/NativeSynthPlaybackEngine';

export function useGuitarProPlayer(song: GuitarProSong) {
  const engineRef = useRef<ReturnType<typeof createPlaybackEngine> | null>(null);
  if (!engineRef.current) engineRef.current = createPlaybackEngine();
  const engine = engineRef.current;
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot>(() => engine.getSnapshot());
  const [countIn, setCountIn] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = engine.subscribe((nextSnapshot) => {
      if (!active) return;
      if (!nextSnapshot.error) {
        setSnapshot(nextSnapshot);
        return;
      }
      setSnapshot({
        ...nextSnapshot,
        error: toUserFacingPlayerError(nextSnapshot.error, 'Playback could not load this song. Try again.'),
      });
    });

    void engine.load(song).catch((reason: unknown) => {
      if (!active) return;
      const detail = toUserFacingPlayerError(reason, 'The song could not be loaded.');
      setSnapshot((current) => ({
        ...current,
        state: 'error',
        duration: song.duration,
        tracks: current.tracks.length ? current.tracks : song.tracks,
        error: `Playback could not load this song: ${detail}`,
      }));
    });

    return () => {
      active = false;
      unsubscribe();
      void engine.dispose().catch(() => {
        // Cleanup failures must not become unhandled rejections after unmount.
      });
    };
  }, [engine, song]);

  useEffect(() => {
    if (!loopEnabled || loopStart === null || loopEnd === null || snapshot.state !== 'playing') return;
    if (snapshot.position >= loopEnd) void engine.seek(loopStart);
  }, [loopEnabled, loopEnd, loopStart, snapshot.position, snapshot.state]);

  const play = useCallback(() => engine.play(countIn), [countIn, engine]);
  const pause = useCallback(() => engine.pause(), [engine]);
  const stop = useCallback(() => engine.stop(), [engine]);
  const seek = useCallback((position: number) => engine.seek(position), [engine]);
  const setSpeed = useCallback((speed: number) => engine.setSpeed(speed), [engine]);
  const setMasterVolume = useCallback((volume: number) => engine.setMasterVolume(volume), [engine]);
  const setTrackVolume = useCallback((trackId: string, volume: number) => engine.setTrackVolume(trackId, volume), [engine]);
  const setTrackMuted = useCallback((trackId: string, muted: boolean) => engine.setTrackMuted(trackId, muted), [engine]);

  const setLoopPoint = useCallback((point: 'start' | 'end') => {
    if (point === 'start') setLoopStart(snapshot.position);
    else setLoopEnd(snapshot.position);
  }, [snapshot.position]);

  const canLoop = loopStart !== null && loopEnd !== null && loopEnd > loopStart;
  const toggleLoop = useCallback(() => {
    if (canLoop) setLoopEnabled((current) => !current);
  }, [canLoop]);

  return useMemo(() => ({
    snapshot,
    countIn,
    setCountIn,
    loopStart,
    loopEnd,
    loopEnabled,
    canLoop,
    setLoopPoint,
    toggleLoop,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    setMasterVolume,
    setTrackVolume,
    setTrackMuted,
  }), [canLoop, countIn, loopEnd, loopEnabled, loopStart, pause, play, seek, setLoopPoint, setMasterVolume, setSpeed, setTrackMuted, setTrackVolume, snapshot, stop, toggleLoop]);
}
