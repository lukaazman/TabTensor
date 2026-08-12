import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TunerDetection, TunerPreferences } from '@/types';
import { loadTunerPreferences, saveTunerPreferences } from '@/storage/preferences';
import { defaultTuningForInstrument, findTuning } from '../tunings';
import { centsBetween, foldToTargets, frequencyForNote, nearestTarget } from '../pitch';
import { createPitchEngine } from '../audio/NativePitchEngine';
import { PitchEngine } from '../audio/PitchEngine';

type TunerStatus = 'loading' | 'listening' | 'denied' | 'unavailable' | 'error';

const EMPTY_PREFERENCES: TunerPreferences = {
  instrumentId: 'acoustic-guitar',
  tuningId: 'standard',
  customTunings: [],
  autoMode: true,
  manualStringIndex: 0,
  calibration: 440,
};

export function useTuner() {
  const [preferences, setPreferences] = useState<TunerPreferences>(EMPTY_PREFERENCES);
  const [status, setStatus] = useState<TunerStatus>('loading');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<TunerDetection | null>(null);
  const engineRef = useRef<PitchEngine | null>(null);
  const smoothingRef = useRef<number | null>(null);
  const lockedStringRef = useRef<number | null>(null);
  const stringCandidateRef = useRef<{ index: number; count: number } | null>(null);

  const tuning = useMemo(
    () => findTuning(preferences.tuningId, preferences.customTunings, preferences.instrumentId),
    [preferences.customTunings, preferences.instrumentId, preferences.tuningId],
  );
  const targetFrequencies = useMemo(
    () => tuning.strings.map((note) => frequencyForNote(note, preferences.calibration)),
    [preferences.calibration, tuning.strings],
  );

  useEffect(() => {
    let alive = true;
    loadTunerPreferences().then((saved) => {
      if (alive) {
        setPreferences(saved);
        setPreferencesReady(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    const engine = createPitchEngine();
    engineRef.current = engine;
    if (!engine.isAvailable()) {
      setStatus('unavailable');
      return () => undefined;
    }

    setStatus('loading');
    engine.start({
      onReading: (reading) => {
        const smoothed = smoothingRef.current === null
          ? reading.frequency
          : smoothingRef.current * 0.72 + reading.frequency * 0.28;
        smoothingRef.current = smoothed;
        const foldedFrequency = foldToTargets(smoothed, targetFrequencies);
        const automaticTarget = nearestTarget(foldedFrequency, targetFrequencies);
        let stringIndex = preferences.autoMode ? automaticTarget.index : preferences.manualStringIndex;

        if (preferences.autoMode) {
          const previous = lockedStringRef.current;
          if (previous !== null && previous !== automaticTarget.index) {
            const previousDistance = Math.abs(centsBetween(foldedFrequency, targetFrequencies[previous]));
            if (previousDistance < Math.abs(automaticTarget.cents) + 18) {
              const candidate = stringCandidateRef.current;
              if (!candidate || candidate.index !== automaticTarget.index) {
                stringCandidateRef.current = { index: automaticTarget.index, count: 1 };
              } else {
                stringCandidateRef.current = { index: candidate.index, count: candidate.count + 1 };
              }
              if ((stringCandidateRef.current?.count ?? 0) < 4) stringIndex = previous;
            }
          }
          lockedStringRef.current = stringIndex;
        } else {
          lockedStringRef.current = preferences.manualStringIndex;
        }

        const targetFrequency = targetFrequencies[stringIndex];
        setDetection({
          frequency: foldedFrequency,
          targetFrequency,
          cents: centsBetween(foldedFrequency, targetFrequency),
          stringIndex,
          noteName: tuning.strings[stringIndex].replace(/-?\d+$/, ''),
          targetNote: tuning.strings[stringIndex],
          level: reading.level,
          confidence: reading.confidence,
        });
        setStatus('listening');
      },
    }).catch((reason: unknown) => {
      const message = reason instanceof Error ? reason.message : 'Unable to start the microphone tuner.';
      setError(message);
      setStatus(message.includes('denied') ? 'denied' : 'error');
    });

    return () => {
      void engine.stop();
      engineRef.current = null;
    };
  }, [preferences.autoMode, preferences.instrumentId, preferences.manualStringIndex, preferencesReady, retryToken, targetFrequencies, tuning.strings]);

  const updatePreferences = useCallback((next: Partial<TunerPreferences>) => {
    setPreferences((current) => {
      const updated = { ...current, ...next };
      void saveTunerPreferences(updated);
      return updated;
    });
  }, []);

  const selectString = useCallback((index: number) => {
    updatePreferences({ manualStringIndex: index, autoMode: false });
    lockedStringRef.current = index;
    stringCandidateRef.current = null;
  }, [updatePreferences]);

  const toggleAuto = useCallback(() => {
    updatePreferences({ autoMode: !preferences.autoMode });
    lockedStringRef.current = null;
    stringCandidateRef.current = null;
  }, [preferences.autoMode, updatePreferences]);

  const setTuning = useCallback((tuningId: TunerPreferences['tuningId']) => {
    updatePreferences({ tuningId, manualStringIndex: 0 });
    smoothingRef.current = null;
    lockedStringRef.current = null;
  }, [updatePreferences]);

  const setInstrument = useCallback((instrumentId: TunerPreferences['instrumentId']) => {
    const defaultTuning = defaultTuningForInstrument(instrumentId);
    updatePreferences({ instrumentId, tuningId: defaultTuning.id, manualStringIndex: 0 });
    smoothingRef.current = null;
    lockedStringRef.current = null;
    stringCandidateRef.current = null;
  }, [updatePreferences]);

  const retry = useCallback(() => {
    setError(null);
    setStatus('loading');
    setRetryToken((current) => current + 1);
  }, []);

  return {
    preferences,
    tuning,
    targetFrequencies,
    status,
    error,
    detection,
    updatePreferences,
    selectString,
    toggleAuto,
    setTuning,
    setInstrument,
    retry,
  };
}
