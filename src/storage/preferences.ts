import { TunerPreferences } from '@/types';
import { readJson, writeJson } from './localStorage';

const DEFAULT_PREFERENCES: TunerPreferences = {
  instrumentId: 'acoustic-guitar',
  tuningId: 'standard',
  customTunings: [],
  autoMode: true,
  manualStringIndex: 0,
  calibration: 440,
};

export async function loadTunerPreferences(): Promise<TunerPreferences> {
  const saved = await readJson<Partial<TunerPreferences>>('tuner-preferences', {});
  return {
    ...DEFAULT_PREFERENCES,
    ...saved,
    instrumentId: saved.instrumentId ?? DEFAULT_PREFERENCES.instrumentId,
    customTunings: saved.customTunings ?? [],
  };
}

export async function saveTunerPreferences(preferences: TunerPreferences): Promise<void> {
  await writeJson('tuner-preferences', preferences);
}

export { DEFAULT_PREFERENCES };
