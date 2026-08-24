import { TunerPreferences } from '@/types';
import { readJson, writeJson } from './localStorage';
import { sanitizeTunerPreferences } from './sanitizers';

const DEFAULT_PREFERENCES: TunerPreferences = {
  instrumentId: 'acoustic-guitar',
  tuningId: 'standard',
  customTunings: [],
  autoMode: true,
  manualStringIndex: 0,
  calibration: 440,
};

export async function loadTunerPreferences(): Promise<TunerPreferences> {
  const saved = await readJson<unknown>('tuner-preferences', {});
  return sanitizeTunerPreferences(saved, DEFAULT_PREFERENCES);
}

export async function saveTunerPreferences(preferences: TunerPreferences): Promise<void> {
  await writeJson('tuner-preferences', sanitizeTunerPreferences(preferences, DEFAULT_PREFERENCES));
}

export { DEFAULT_PREFERENCES };
