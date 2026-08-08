import { PitchReading } from '@/types';

export type PitchEngineCallbacks = {
  onReading: (reading: PitchReading) => void;
};

export interface PitchEngine {
  start(callbacks: PitchEngineCallbacks): Promise<void>;
  stop(): Promise<void>;
  isAvailable(): boolean;
}
