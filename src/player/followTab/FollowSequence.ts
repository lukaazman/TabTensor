export type FollowNoteLike = {
  id: string;
  stringNumber?: number;
  fret?: number;
  midi: number;
  start: number;
  duration: number;
  measureIndex: number;
};

export type FollowStep = {
  index: number;
  start: number;
  duration: number;
  measureIndex: number;
  notes: Array<{ id: string; stringNumber: number | null; fret: number | null; midi: number }>;
  isChord: boolean;
};

const SAME_EVENT_SECONDS = 0.012;

export function buildFollowSequence(notes: FollowNoteLike[]): FollowStep[] {
  const sorted = notes
    .filter((note) => Number.isFinite(note.midi) && note.midi >= 0 && note.midi <= 127 && Number.isFinite(note.start))
    .sort((a, b) => a.start - b.start || a.midi - b.midi);
  const steps: FollowStep[] = [];

  sorted.forEach((note) => {
    const previous = steps[steps.length - 1];
    if (!previous || Math.abs(previous.start - note.start) > SAME_EVENT_SECONDS) {
      steps.push({
        index: steps.length,
        start: note.start,
        duration: durationForNote(note.duration),
        measureIndex: note.measureIndex,
        notes: [{ id: note.id, stringNumber: toOptionalInteger(note.stringNumber), fret: toOptionalInteger(note.fret), midi: Math.round(note.midi) }],
        isChord: false,
      });
      return;
    }

    if (!previous.notes.some((candidate) => candidate.midi === Math.round(note.midi) && candidate.stringNumber === toOptionalInteger(note.stringNumber) && candidate.fret === toOptionalInteger(note.fret))) {
      previous.notes.push({ id: note.id, stringNumber: toOptionalInteger(note.stringNumber), fret: toOptionalInteger(note.fret), midi: Math.round(note.midi) });
    }
    previous.duration = Math.max(previous.duration, durationForNote(note.duration));
    previous.isChord = previous.notes.length > 1;
  });

  return steps;
}

export function findStepIndexForPosition(
  steps: FollowStep[],
  position: number,
  loopStart: number | null = null,
  loopEnd: number | null = null,
): number {
  if (!steps.length) return 0;
  const bounded = hasValidLoop(loopStart, loopEnd)
    ? steps.filter((step) => step.start >= (loopStart as number) - SAME_EVENT_SECONDS && step.start < (loopEnd as number))
    : steps;
  const candidates = bounded.length ? bounded : steps;
  const current = candidates.find((step) => position < step.start + Math.max(step.duration, 0.08));
  return current?.index ?? candidates[candidates.length - 1].index;
}

export function nextStepIndex(
  steps: FollowStep[],
  currentIndex: number,
  loopStart: number | null = null,
  loopEnd: number | null = null,
): number | null {
  if (!steps.length) return null;
  const next = steps.slice(currentIndex + 1).find((step) => !hasValidLoop(loopStart, loopEnd) || (step.start >= (loopStart as number) && step.start < (loopEnd as number)));
  if (next) return next.index;
  if (hasValidLoop(loopStart, loopEnd)) {
    const first = steps.find((step) => step.start >= (loopStart as number) && step.start < (loopEnd as number));
    return first?.index ?? null;
  }
  return null;
}

function durationForNote(duration: number): number {
  return Number.isFinite(duration) ? Math.max(0.04, duration) : 0.04;
}

function toOptionalInteger(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function hasValidLoop(loopStart: number | null, loopEnd: number | null): boolean {
  return loopStart !== null && loopEnd !== null && Number.isFinite(loopStart) && Number.isFinite(loopEnd) && loopEnd > loopStart;
}