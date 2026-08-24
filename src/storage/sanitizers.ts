import type { InstrumentId, RecentFile, TunerPreferences, TuningDefinition } from '../types';

const INSTRUMENT_STRING_COUNTS: Record<InstrumentId, number> = {
  'acoustic-guitar': 6,
  'electric-guitar': 6,
  'classical-guitar': 6,
  'guitar-7': 7,
  'guitar-8': 8,
  ukulele: 4,
  'bass-4': 4,
  'bass-5': 5,
  mandolin: 4,
  violin: 4,
  banjo: 5,
};

const VALID_INSTRUMENT_IDS = new Set<InstrumentId>(Object.keys(INSTRUMENT_STRING_COUNTS) as InstrumentId[]);
const VALID_STRING_COUNTS = new Set(Object.values(INSTRUMENT_STRING_COUNTS));
const NOTE_NAME_PATTERN = /^[A-Ga-g](?:#|b)?-?\d+$/;

type UnknownRecord = Record<string, unknown>;

export function sanitizeRecentFiles(value: unknown, limit = 12): RecentFile[] {
  if (!Array.isArray(value) || limit <= 0) return [];

  const result: RecentFile[] = [];
  const seenIds = new Set<string>();
  for (const item of value) {
    const record = asRecord(item);
    const id = nonEmptyString(record?.id, 4096);
    const uri = nonEmptyString(record?.uri, 4096);
    const name = basename(nonEmptyString(record?.name, 512) ?? '');
    const format = nonEmptyString(record?.format, 32);
    const openedAt = record?.openedAt;
    if (!id || !uri || !name || !format || typeof openedAt !== 'number' || !Number.isFinite(openedAt) || openedAt <= 0 || seenIds.has(id)) continue;

    const file: RecentFile = { id, name, uri, format, openedAt };
    const title = nonEmptyString(record?.title, 512);
    const artist = nonEmptyString(record?.artist, 512);
    if (title) file.title = title;
    if (artist) file.artist = artist;
    result.push(file);
    seenIds.add(id);
    if (result.length >= Math.floor(limit)) break;
  }
  return result;
}

export function sanitizeTunerPreferences(value: unknown, fallback: TunerPreferences): TunerPreferences {
  const record = asRecord(value);
  const instrumentId = isInstrumentId(record?.instrumentId) ? record.instrumentId : fallback.instrumentId;
  const customTunings = record?.customTunings === undefined
    ? fallback.customTunings
    : sanitizeCustomTunings(record.customTunings);
  const savedIndex = finiteNumber(record?.manualStringIndex);
  const savedCalibration = finiteNumber(record?.calibration);

  return {
    instrumentId,
    tuningId: nonEmptyString(record?.tuningId, 128) ?? fallback.tuningId,
    customTunings,
    autoMode: typeof record?.autoMode === 'boolean' ? record.autoMode : fallback.autoMode,
    manualStringIndex: clampStringIndex(savedIndex ?? fallback.manualStringIndex, instrumentId),
    calibration: clampCalibration(savedCalibration ?? fallback.calibration),
  };
}

function sanitizeCustomTunings(value: unknown): TuningDefinition[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const tuning = sanitizeCustomTuning(item);
    return tuning ? [tuning] : [];
  });
}

function sanitizeCustomTuning(value: unknown): TuningDefinition | null {
  const record = asRecord(value);
  const id = nonEmptyString(record?.id, 128);
  const name = nonEmptyString(record?.name, 128);
  const shortName = nonEmptyString(record?.shortName, 256);
  if (!id || !name || !shortName || !Array.isArray(record?.strings) || record.strings.length === 0 || record.strings.length > 8) return null;

  const strings = record.strings.map((note) => typeof note === 'string' ? note.trim() : '').filter((note) => NOTE_NAME_PATTERN.test(note));
  if (strings.length !== record.strings.length) return null;

  let instrumentIds: InstrumentId[] | undefined;
  if (record.instrumentIds !== undefined) {
    if (!Array.isArray(record.instrumentIds)) return null;
    instrumentIds = record.instrumentIds.filter(isInstrumentId).filter((instrumentId) => INSTRUMENT_STRING_COUNTS[instrumentId] === strings.length);
    if (!instrumentIds.length) return null;
  } else if (!VALID_STRING_COUNTS.has(strings.length)) {
    return null;
  }

  return {
    id,
    name,
    shortName,
    strings,
    ...(instrumentIds ? { instrumentIds } : {}),
    ...(typeof record.isCustom === 'boolean' ? { isCustom: record.isCustom } : {}),
  };
}

function clampStringIndex(value: number, instrumentId: InstrumentId): number {
  const max = Math.max(0, (INSTRUMENT_STRING_COUNTS[instrumentId] ?? 6) - 1);
  return Math.min(max, Math.max(0, Math.floor(value)));
}

function clampCalibration(value: number): number {
  return Math.min(450, Math.max(430, Math.round(value)));
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isInstrumentId(value: unknown): value is InstrumentId {
  return typeof value === 'string' && VALID_INSTRUMENT_IDS.has(value as InstrumentId);
}

function nonEmptyString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) return undefined;
  return value;
}

function basename(value: string): string {
  const normalized = value.replace(/\\/g, '/');
  return normalized.slice(normalized.lastIndexOf('/') + 1).trim();
}

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}
