import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlaybackTrack, PitchReading } from '@/types';
import { createPitchEngine } from '@/tuner/audio/NativePitchEngine';
import { PitchEngine } from '@/tuner/audio/PitchEngine';
import {
  ConfirmationMode,
  confirmationFramesForMode,
  matchDetectedPitch,
  PitchToleranceMode,
  toleranceForMode,
} from './NoteMatcher';
import { FollowStep, buildFollowSequence, findStepIndexForPosition, nextStepIndex } from './FollowSequence';
import { frequencyToMidi, midiToNoteName } from './pitch';

export type FollowStatus = 'off' | 'starting' | 'count-in' | 'listening' | 'paused' | 'complete' | 'denied' | 'unavailable' | 'error';
export type FollowFeedback = 'idle' | 'wrong' | 'correct';

export type FollowSettings = {
  toleranceMode: PitchToleranceMode;
  sensitivity: number;
  confirmationMode: ConfirmationMode;
};

export type FollowDetection = {
  frequency: number;
  midi: number;
  noteName: string;
  cents: number | null;
  level: number;
  confidence: number;
  correct: boolean;
};

export type UseFollowTabOptions = {
  track?: PlaybackTrack;
  position: number;
  duration: number;
  tempo: number;
  timeSignature?: string;
  countIn: boolean;
  loopStart: number | null;
  loopEnd: number | null;
  onSeek: (position: number) => Promise<void>;
};

export type FollowTabController = {
  enabled: boolean;
  status: FollowStatus;
  error: string | null;
  expectedStep: FollowStep | null;
  sequenceLength: number;
  stepNumber: number;
  detection: FollowDetection | null;
  feedback: FollowFeedback;
  countInRemaining: number | null;
  settings: FollowSettings;
  toleranceCents: number;
  confirmationFrames: number;
  isRunning: boolean;
  transportState: 'playing' | 'paused';
  advanceToken: number;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  advance: () => Promise<void>;
  updateSettings: (next: Partial<FollowSettings>) => void;
};

const DEFAULT_SETTINGS: FollowSettings = {
  toleranceMode: 'normal',
  sensitivity: 0.5,
  confirmationMode: 'normal',
};

export function useFollowTab({
  track,
  position,
  duration,
  tempo,
  timeSignature,
  countIn,
  loopStart,
  loopEnd,
  onSeek,
}: UseFollowTabOptions): FollowTabController {
  const sequence = useMemo(() => buildFollowSequence(track?.notes ?? []), [track?.id, track?.notes]);
  const [enabled, setEnabledState] = useState(false);
  const [status, setStatus] = useState<FollowStatus>('off');
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [detection, setDetection] = useState<FollowDetection | null>(null);
  const [feedback, setFeedback] = useState<FollowFeedback>('idle');
  const [countInRemaining, setCountInRemaining] = useState<number | null>(null);
  const [settings, setSettings] = useState<FollowSettings>(DEFAULT_SETTINGS);
  const [advanceToken, setAdvanceToken] = useState(0);

  const engineRef = useRef<PitchEngine | null>(null);
  const sessionRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candidateRef = useRef<{ stepIndex: number; midi: number; count: number } | null>(null);
  const advanceInFlightRef = useRef(false);
  const internalSeekPositionRef = useRef<number | null>(null);
  const previousPositionRef = useRef(position);
  const previousLoopStartRef = useRef(loopStart);
  const previousLoopEndRef = useRef(loopEnd);
  const lastUiUpdateRef = useRef(0);
  const stepRef = useRef<FollowStep | null>(null);
  const settingsRef = useRef(settings);
  const enabledRef = useRef(enabled);
  const statusRef = useRef(status);
  const feedbackRef = useRef(feedback);
  const advanceRef = useRef<() => Promise<void>>(async () => undefined);

  const expectedStep = sequence[stepIndex] ?? null;
  stepRef.current = expectedStep;
  settingsRef.current = settings;
  enabledRef.current = enabled;
  statusRef.current = status;
  feedbackRef.current = feedback;

  const toleranceCents = toleranceForMode(settings.toleranceMode);
  const confirmationFrames = confirmationFramesForMode(settings.confirmationMode);

  const stopEngine = useCallback(async () => {
    const engine = engineRef.current;
    engineRef.current = null;
    if (!engine) return;
    try {
      await engine.stop();
    } catch {
      // A stopped recorder is already in the desired state.
    }
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountInRemaining(null);
  }, []);

  const resetMatcher = useCallback(() => {
    candidateRef.current = null;
    lastUiUpdateRef.current = 0;
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = null;
    setDetection(null);
    setFeedback('idle');
  }, []);

  const advanceStep = useCallback(async () => {
    const current = stepRef.current;
    if (
      !current
      || advanceInFlightRef.current
      || statusRef.current === 'off'
      || statusRef.current === 'starting'
      || statusRef.current === 'count-in'
      || statusRef.current === 'complete'
    ) return;

    advanceInFlightRef.current = true;
    candidateRef.current = null;
    try {
      const nextIndex = nextStepIndex(sequence, current.index, loopStart, loopEnd);
      setAdvanceToken((value) => value + 1);

      if (nextIndex === null) {
        statusRef.current = 'complete';
        setStatus('complete');
        await stopEngine();
        return;
      }

      const next = sequence[nextIndex];
      stepRef.current = next ?? null;
      setStepIndex(nextIndex);
      if (next) {
        internalSeekPositionRef.current = next.start;
        await onSeek(Math.min(duration, Math.max(0, next.start)));
      }
    } finally {
      advanceInFlightRef.current = false;
    }
  }, [duration, loopEnd, loopStart, onSeek, sequence, stopEngine]);

  advanceRef.current = advanceStep;

  const processReading = useCallback((reading: PitchReading) => {
    if (!enabledRef.current || statusRef.current !== 'listening') return;
    const step = stepRef.current;
    if (!step || reading.level < inputLevelForSensitivity(settingsRef.current.sensitivity)) {
      candidateRef.current = null;
      return;
    }

    const detectedMidi = frequencyToMidi(reading.frequency);
    if (detectedMidi === null) return;
    const nearestMidi = Math.round(detectedMidi);
    const chord = step.isChord;
    const match = chord ? null : matchDetectedPitch(reading.frequency, step.notes[0].midi, toleranceForMode(settingsRef.current.toleranceMode));
    const correct = Boolean(match?.correct);
    const nextDetection: FollowDetection = {
      frequency: reading.frequency,
      midi: detectedMidi,
      noteName: match?.detectedNote ?? midiToNoteName(nearestMidi),
      cents: match?.cents ?? null,
      level: reading.level,
      confidence: reading.confidence,
      correct,
    };
    const now = Date.now();
    const nextFeedback: FollowFeedback = chord ? 'idle' : correct ? 'correct' : 'wrong';
    if (now - lastUiUpdateRef.current >= 80 || nextFeedback !== feedbackRef.current) {
      lastUiUpdateRef.current = now;
      setDetection(nextDetection);
      setFeedback(nextFeedback);
    }

    if (!match?.correct) {
      candidateRef.current = null;
      return;
    }

    const previous = candidateRef.current;
    const candidate = previous && previous.stepIndex === step.index && previous.midi === nearestMidi
      ? { ...previous, count: previous.count + 1 }
      : { stepIndex: step.index, midi: nearestMidi, count: 1 };
    candidateRef.current = candidate;
    if (candidate.count >= confirmationFramesForMode(settingsRef.current.confirmationMode)) {
      setFeedback('correct');
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback('idle'), 650);
      void advanceRef.current();
    }
  }, []);

  const startEngine = useCallback(async (session: number) => {
    await stopEngine();
    if (session !== sessionRef.current || !enabledRef.current) return;
    const engine = createPitchEngine();
    if (!engine.isAvailable()) {
      const message = 'Microphone audio is unavailable. Build TabTensor with the native development client.';
      statusRef.current = 'unavailable';
      setError(message);
      setStatus('unavailable');
      return;
    }

    engineRef.current = engine;
    statusRef.current = 'starting';
    setStatus('starting');
    try {
      await engine.start(
        { onReading: processReading },
        {
          sampleRate: 44100,
          bufferLength: 2048,
          channelCount: 1,
          minimumLevel: 0.002,
          minFrequency: 65,
          maxFrequency: 1200,
        },
      );
      if (session !== sessionRef.current || !enabledRef.current) {
        if (engineRef.current === engine) engineRef.current = null;
        await engine.stop();
        return;
      }
      statusRef.current = 'listening';
      setStatus('listening');
    } catch (reason: unknown) {
      if (session !== sessionRef.current || !enabledRef.current) return;
      const message = reason instanceof Error ? reason.message : 'Unable to start Follow Tab microphone input.';
      const permissionDenied = message.toLowerCase().includes('permission');
      statusRef.current = permissionDenied ? 'denied' : 'error';
      setError(message);
      setStatus(permissionDenied ? 'denied' : 'error');
      if (engineRef.current === engine) engineRef.current = null;
      try {
        await engine.stop();
      } catch {
        // Permission and recorder failures must not crash the screen.
      }
    }
  }, [processReading, stopEngine]);

  useEffect(() => {
    if (!enabled) {
      sessionRef.current += 1;
      clearCountdown();
      void stopEngine();
      statusRef.current = 'off';
      setStatus('off');
      return;
    }

    const session = sessionRef.current + 1;
    sessionRef.current = session;
    setError(null);
    resetMatcher();

    if (!sequence.length) {
      const message = 'The selected track contains no playable notes for Follow Tab.';
      statusRef.current = 'error';
      setError(message);
      setStatus('error');
      return () => {
        sessionRef.current += 1;
        void stopEngine();
      };
    }

    const initialIndex = findStepIndexForPosition(sequence, position, loopStart, loopEnd);
    stepRef.current = sequence[initialIndex] ?? null;
    setStepIndex(initialIndex);

    const beats = countIn ? countInBeats(timeSignature) : 0;
    if (beats > 0) {
      let remaining = beats;
      statusRef.current = 'count-in';
      setStatus('count-in');
      setCountInRemaining(remaining);
      const beatMilliseconds = Math.max(180, 60000 / Math.max(tempo, 1));
      countdownRef.current = setInterval(() => {
        if (session !== sessionRef.current) return;
        remaining -= 1;
        if (remaining <= 0) {
          clearCountdown();
          statusRef.current = 'starting';
          setStatus('starting');
          void startEngine(session);
        } else {
          setCountInRemaining(remaining);
        }
      }, beatMilliseconds);
    } else {
      statusRef.current = 'starting';
      setStatus('starting');
      void startEngine(session);
    }

    return () => {
      sessionRef.current += 1;
      clearCountdown();
      void stopEngine();
    };
  }, [clearCountdown, countIn, resetMatcher, sequence, startEngine, stopEngine, enabled]);

  useEffect(() => {
    const loopChanged = previousLoopStartRef.current !== loopStart || previousLoopEndRef.current !== loopEnd;
    previousLoopStartRef.current = loopStart;
    previousLoopEndRef.current = loopEnd;
    if (!enabled) {
      previousPositionRef.current = position;
      return;
    }
    const previous = previousPositionRef.current;
    previousPositionRef.current = position;
    const internalTarget = internalSeekPositionRef.current;
    if (internalTarget !== null && Math.abs(position - internalTarget) < 0.08) {
      internalSeekPositionRef.current = null;
      return;
    }
    if (loopChanged || Math.abs(position - previous) > 0.04) {
      const nextIndex = findStepIndexForPosition(sequence, position, loopStart, loopEnd);
      if (nextIndex !== stepRef.current?.index) {
        candidateRef.current = null;
        stepRef.current = sequence[nextIndex] ?? null;
        setStepIndex(nextIndex);
      }
    }
  }, [enabled, loopEnd, loopStart, position, sequence]);

  useEffect(() => () => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    void stopEngine();
  }, [stopEngine]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
  }, []);

  const toggle = useCallback(() => setEnabledState((value) => !value), []);

  const pause = useCallback(async () => {
    if (!enabled) return;
    sessionRef.current += 1;
    clearCountdown();
    await stopEngine();
    statusRef.current = 'paused';
    setStatus('paused');
  }, [clearCountdown, enabled, stopEngine]);

  const resume = useCallback(async () => {
    if (!enabled) {
      setEnabledState(true);
      return;
    }
    if (statusRef.current === 'complete') {
      const restartIndex = findStepIndexForPosition(sequence, loopStart ?? 0, loopStart, loopEnd);
      stepRef.current = sequence[restartIndex] ?? null;
      setStepIndex(restartIndex);
      internalSeekPositionRef.current = sequence[restartIndex]?.start ?? 0;
      await onSeek(sequence[restartIndex]?.start ?? 0);
    }
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    setError(null);
    statusRef.current = 'starting';
    setStatus('starting');
    await startEngine(session);
  }, [enabled, loopEnd, loopStart, onSeek, sequence, startEngine]);

  const stop = useCallback(async () => {
    sessionRef.current += 1;
    clearCountdown();
    await stopEngine();
    statusRef.current = 'off';
    setStatus('off');
    setEnabledState(false);
    resetMatcher();
  }, [clearCountdown, resetMatcher, stopEngine]);

  const seekTo = useCallback(async (nextPosition: number) => {
    const bounded = Math.min(duration, Math.max(0, nextPosition));
    const nextIndex = findStepIndexForPosition(sequence, bounded, loopStart, loopEnd);
    stepRef.current = sequence[nextIndex] ?? null;
    setStepIndex(nextIndex);
    candidateRef.current = null;
    internalSeekPositionRef.current = bounded;
    await onSeek(bounded);
  }, [duration, loopEnd, loopStart, onSeek, sequence]);

  const updateSettings = useCallback((next: Partial<FollowSettings>) => {
    setSettings((current) => ({ ...current, ...next }));
    candidateRef.current = null;
  }, []);

  const expectedStepForResult = sequence[stepIndex] ?? null;
  const isRunning = status === 'starting' || status === 'count-in' || status === 'listening';

  return {
    enabled,
    status,
    error,
    expectedStep: expectedStepForResult,
    sequenceLength: sequence.length,
    stepNumber: expectedStepForResult ? expectedStepForResult.index + 1 : 0,
    detection,
    feedback,
    countInRemaining,
    settings,
    toleranceCents,
    confirmationFrames,
    isRunning,
    transportState: isRunning ? 'playing' : 'paused',
    advanceToken,
    setEnabled,
    toggle,
    pause,
    resume,
    stop,
    seekTo,
    advance: advanceStep,
    updateSettings,
  };
}

function inputLevelForSensitivity(sensitivity: number): number {
  const normalized = Math.min(1, Math.max(0, sensitivity));
  return 0.012 - normalized * 0.01;
}

function countInBeats(timeSignature?: string): number {
  const numerator = Number(timeSignature?.split('/')[0]);
  return Number.isFinite(numerator) && numerator > 0 ? Math.min(8, Math.round(numerator)) : 4;
}