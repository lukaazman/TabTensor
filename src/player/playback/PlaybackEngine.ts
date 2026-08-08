import { GuitarProSong, PlaybackSnapshot } from '@/types';

export interface PlaybackEngine {
  load(song: GuitarProSong): Promise<void>;
  play(countIn: boolean): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(position: number): Promise<void>;
  setSpeed(speed: number): Promise<void>;
  setMasterVolume(volume: number): Promise<void>;
  setTrackVolume(trackId: string, volume: number): Promise<void>;
  setTrackMuted(trackId: string, muted: boolean): Promise<void>;
  subscribe(listener: (snapshot: PlaybackSnapshot) => void): () => void;
  getSnapshot(): PlaybackSnapshot;
  dispose(): Promise<void>;
  isAvailable(): boolean;
}
