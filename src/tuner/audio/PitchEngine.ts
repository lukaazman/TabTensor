import { PitchReading } from '@/types';

export type PitchEngineCallbacks = {
  onReading: (reading: PitchReading) => void;
};

export type PitchEngineOptions = {
  sampleRate?: number;
  bufferLength?: number;
  channelCount?: number;
  minimumLevel?: number;
  minFrequency?: number;
  maxFrequency?: number;
};

export interface PitchEngine {
  start(callbacks: PitchEngineCallbacks, options?: PitchEngineOptions): Promise<void>;
  stop(): Promise<void>;
  isAvailable(): boolean;
}
