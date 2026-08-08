export type AppTab = 'tuner' | 'player';

export type TuningId =
  | 'standard'
  | 'half-step-down'
  | 'full-step-down'
  | 'drop-d'
  | 'drop-c'
  | 'd-standard'
  | 'open-g'
  | 'open-d'
  | 'dadgad'
  | 'custom';

export type TuningDefinition = {
  id: TuningId;
  name: string;
  shortName: string;
  strings: string[];
  isCustom?: boolean;
};

export type TunerPreferences = {
  tuningId: TuningId;
  customTunings: TuningDefinition[];
  autoMode: boolean;
  manualStringIndex: number;
  calibration: number;
};

export type PitchReading = {
  frequency: number;
  level: number;
  confidence: number;
};

export type TunerDetection = {
  frequency: number;
  targetFrequency: number;
  cents: number;
  stringIndex: number;
  noteName: string;
  targetNote: string;
  level: number;
  confidence: number;
};

export type PlaybackTechnique =
  | 'hammer-on'
  | 'pull-off'
  | 'bend'
  | 'slide'
  | 'vibrato'
  | 'palm-mute'
  | 'let-ring'
  | 'tap'
  | 'mute'
  | 'harmonic'
  | 'tie'
  | 'accent';

export type PlaybackNote = {
  id: string;
  midi: number;
  fret: number;
  stringNumber: number;
  start: number;
  duration: number;
  velocity: number;
  measureIndex: number;
  beatIndex: number;
  techniques: PlaybackTechnique[];
};

export type PlaybackBeat = {
  index: number;
  start: number;
  duration: number;
  notes: PlaybackNote[];
  isRest: boolean;
  dotted: number;
  tuplet: { num: number; den: number } | null;
};

export type PlaybackTrack = {
  id: string;
  name: string;
  instrument?: string;
  volume: number;
  muted: boolean;
  notes: PlaybackNote[];
};

export type PlaybackMeasure = {
  index: number;
  start: number;
  duration: number;
  timeSignature?: string;
  beats: PlaybackBeat[];
};

export type GuitarProSong = {
  id: string;
  title: string;
  artist: string;
  tempo: number;
  duration: number;
  timeSignature?: string;
  sourceUri: string;
  sourceName: string;
  format: string;
  tracks: PlaybackTrack[];
  measures: PlaybackMeasure[];
};

export type RecentFile = {
  id: string;
  name: string;
  uri: string;
  title?: string;
  artist?: string;
  format: string;
  openedAt: number;
};

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

export type PlaybackSnapshot = {
  state: PlaybackState;
  position: number;
  duration: number;
  speed: number;
  masterVolume: number;
  tracks: PlaybackTrack[];
  error?: string;
};
