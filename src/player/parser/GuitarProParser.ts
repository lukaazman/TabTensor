import * as FileSystem from 'expo-file-system/legacy';
import { parseTabFile } from 'guitarpro-parser';
import { DOMParser as LinkedomDOMParser } from 'linkedom';
import { GuitarProSong, PlaybackBeat, PlaybackMeasure, PlaybackNote, PlaybackTechnique, PlaybackTrack } from '@/types';
import { midiFromNoteName } from '@/tuner/tunings';

const SUPPORTED_EXTENSIONS = ['gp3', 'gp4', 'gp5', 'gpx', 'gp', 'gp7', 'gp8'];

type UnknownRecord = Record<string, unknown>;

export function isSupportedGuitarProFile(name: string): boolean {
  const extension = getExtension(name);
  return SUPPORTED_EXTENSIONS.includes(extension);
}

export function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export async function parseGuitarProFile(uri: string, sourceName: string): Promise<GuitarProSong> {
  if (!isSupportedGuitarProFile(sourceName)) {
    throw new Error('Unsupported file. Select a Guitar Pro file ending in .gp, .gp3, .gp4, .gp5, .gpx, .gp7 or .gp8.');
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error('This file is no longer available on the device.');
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const bytes = base64ToBytes(base64);

  try {
    // guitarpro-parser falls back to a dynamic Node require for GP7 files.
    // Metro cannot resolve that runtime require in React Native, so provide
    // its DOMParser explicitly before parsing GP7/GPX XML.
    const runtime = globalThis as unknown as { DOMParser?: unknown };
    if (!runtime.DOMParser) runtime.DOMParser = LinkedomDOMParser;
    const parsed = parseTabFile(bytes, sourceName) as unknown as UnknownRecord;
    return normalizeSong(parsed, uri, sourceName);
  } catch (reason: unknown) {
    const detail = reason instanceof Error ? reason.message : 'The file could not be decoded.';
    throw new Error(`Failed to parse Guitar Pro file: ${detail}`);
  }
}

function normalizeSong(raw: UnknownRecord, sourceUri: string, sourceName: string): GuitarProSong {
  const tempo = readNumber(raw.tempo, readNumber(readRecord(raw.header)?.tempo, 120));
  const rawTracks = readArray(raw.tracks);
  if (!rawTracks.length) throw new Error('No tracks detected in this Guitar Pro file.');

  const tracks: PlaybackTrack[] = rawTracks.map((rawTrack, trackIndex) => normalizeTrack(rawTrack, trackIndex, tempo));
  const measures = buildMeasures(tracks, raw);
  const duration = Math.max(measures.at(-1)?.start ?? 0, ...tracks.flatMap((track) => track.notes.map((note) => note.start + note.duration)));
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('The file contains no playable notes.');

  const title = readString(raw.title, readString(raw.name, stripExtension(sourceName))) || stripExtension(sourceName);
  const artist = readString(raw.artist, readString(raw.artistName, ''));
  const timeSignature = readTimeSignature(raw.timeSignature) ?? measures[0]?.timeSignature;

  return {
    id: `${sourceUri}:${sourceName}`,
    title,
    artist,
    tempo: tempo > 0 ? tempo : 120,
    duration,
    timeSignature,
    sourceUri,
    sourceName,
    format: getExtension(sourceName).toUpperCase(),
    tracks,
    measures,
  };
}

function normalizeTrack(rawTrackValue: unknown, trackIndex: number, tempo: number): PlaybackTrack {
  const rawTrack = asRecord(rawTrackValue);
  const notes: PlaybackNote[] = [];
  const bars = readArray(rawTrack.bars ?? rawTrack.measures);
  let absoluteBarStart = 0;

  bars.forEach((barValue, measureIndex) => {
    const bar = asRecord(barValue);
    const beats = readArray(bar.beats ?? bar.beatGroups ?? bar.items);
    let beatStart = absoluteBarStart;
    beats.forEach((beatValue, beatIndex) => {
      const beat = asRecord(beatValue);
      const durationBeats = durationToBeats(
        beat.duration ?? beat.length ?? beat.rhythm,
        beat.dotted,
        beat.tuplet,
      );
      const duration = durationBeats * 60 / Math.max(readNumber(beat.tempo, tempo), 1);
      const notesInBeat = readArray(beat.notes ?? beat.noteList);
      notesInBeat.forEach((noteValue, noteIndex) => {
        const note = asRecord(noteValue);
        const stringNumber = readNumber(note.string, readNumber(note.stringNumber, 0));
        const fret = readNumber(note.fret, 0);
        const midi = resolveMidi(note, rawTrack, stringNumber, fret);
        if (midi === null) return;
        notes.push({
          id: `${trackIndex}-${measureIndex}-${beatIndex}-${noteIndex}`,
          midi,
          fret,
          stringNumber,
          start: beatStart,
          duration: Math.max(duration * readNumber(note.durationMultiplier, 1), 0.04),
          velocity: clamp(readNumber(note.velocity, 0.8), 0.05, 1),
          measureIndex,
          beatIndex,
          techniques: readTechniques(note),
        });
      });
      beatStart += duration;
    });
    const barDuration = readNumber(bar.durationSeconds, beatStart - absoluteBarStart) || barDurationFromTimeSignature(bar.timeSignature, tempo);
    absoluteBarStart += Math.max(barDuration, beatStart - absoluteBarStart, 60 / Math.max(tempo, 1));
  });

  // Some parser versions expose a flattened note list instead of bars.
  if (!notes.length) {
    readArray(rawTrack.notes).forEach((noteValue, index) => {
      const note = asRecord(noteValue);
      const start = readNumber(note.start, readNumber(note.time, 0));
      const durationBeats = durationToBeats(note.duration);
      const midi = resolveMidi(note, rawTrack, readNumber(note.string, 0), readNumber(note.fret, 0));
      if (midi !== null) {
        notes.push({
          id: `${trackIndex}-flat-${index}`,
          midi,
          fret: readNumber(note.fret, 0),
          stringNumber: readNumber(note.string, 0),
          start: start > 20 ? start / 1000 : start,
          duration: Math.max(durationBeats * 60 / Math.max(tempo, 1), 0.04),
          velocity: clamp(readNumber(note.velocity, 0.8), 0.05, 1),
          measureIndex: readNumber(note.measureIndex, 0),
          beatIndex: readNumber(note.beatIndex, 0),
          techniques: readTechniques(note),
        });
      }
    });
  }

  return {
    id: String(rawTrack.id ?? `track-${trackIndex}`),
    name: readString(rawTrack.name, `Track ${trackIndex + 1}`),
    instrument: readString(rawTrack.instrument, readString(rawTrack.program, '')) || undefined,
    volume: 1,
    muted: false,
    notes,
  };
}

function buildMeasures(tracks: PlaybackTrack[], rawSong: UnknownRecord): PlaybackMeasure[] {
  const rawBars = readArray(rawSong.bars ?? rawSong.measures).length
    ? readArray(rawSong.bars ?? rawSong.measures)
    : readArray(asRecord(readArray(rawSong.tracks)[0]).bars);
  if (rawBars.length) {
    let cursor = 0;
    return rawBars.map((barValue, index) => {
      const bar = asRecord(barValue);
      const timeSignature = readTimeSignature(bar.timeSignature);
      const rawBeats = readArray(bar.beats);
      const trackNotes = tracks.flatMap((track) => track.notes.filter((note) => note.measureIndex === index));
      const beats: PlaybackBeat[] = [];
      let beatCursor = cursor;

      rawBeats.forEach((beatValue, beatIndex) => {
        const beat = asRecord(beatValue);
        const beatDuration = durationToBeats(
          beat.duration,
          beat.dotted,
          beat.tuplet,
        ) * 60 / Math.max(readNumber(beat.tempo, readNumber(rawSong.tempo, 120)), 1);
        const notes = trackNotes.filter((note) => note.start >= beatCursor - 0.005 && note.start < beatCursor + beatDuration - 0.005);
        beats.push({
          index: beatIndex,
          start: notes[0]?.start ?? beatCursor,
          duration: Math.max(beatDuration, 0.04),
          notes,
          isRest: readBoolean(beat.isRest),
          dotted: readDotCount(beat.dotted),
          tuplet: readTuplet(beat.tuplet),
        });
        beatCursor += beatDuration;
      });

      if (!beats.length) {
        const beatStarts = [...new Set(trackNotes.map((note) => note.start))].sort((a, b) => a - b);
        beatStarts.forEach((start, beatIndex) => {
          beats.push({
            index: beatIndex,
            start,
            duration: Math.max(trackNotes.find((note) => note.start === start)?.duration ?? 0.25, 0.04),
            notes: trackNotes.filter((note) => note.start === start),
            isRest: false,
            dotted: 0,
            tuplet: null,
          });
        });
      }

      const rawBeatDuration = beatCursor - cursor;
      const barDuration = readNumber(bar.durationSeconds, rawBeatDuration)
        || barDurationFromTimeSignature(timeSignature, readNumber(rawSong.tempo, 120));
      const duration = Math.max(barDuration, rawBeatDuration, 60 / Math.max(readNumber(rawSong.tempo, 120), 1));
      const result: PlaybackMeasure = {
        index,
        start: cursor,
        duration: Math.max(duration, 0.1),
        timeSignature,
        beats,
      };
      cursor += result.duration;
      return result;
    });
  }

  const maxMeasure = Math.max(0, ...tracks.flatMap((track) => track.notes.map((note) => note.measureIndex)));
  return Array.from({ length: maxMeasure + 1 }, (_, index) => {
    const notes = tracks.flatMap((track) => track.notes.filter((note) => note.measureIndex === index));
    const start = notes.length ? Math.min(...notes.map((note) => note.start)) : index;
    const duration = notes.length ? Math.max(...notes.map((note) => note.start + note.duration)) - start : 1;
    const starts = [...new Set(notes.map((note) => note.start))].sort((a, b) => a - b);
    return {
      index,
      start,
      duration: Math.max(duration, 0.1),
      beats: starts.map((beatStart, beatIndex) => ({
        index: beatIndex,
        start: beatStart,
        duration: Math.max(notes.find((note) => note.start === beatStart)?.duration ?? 0.25, 0.04),
        notes: notes.filter((note) => note.start === beatStart),
        isRest: false,
        dotted: 0,
        tuplet: null,
      })),
    };
  });
}

function resolveMidi(note: UnknownRecord, track: UnknownRecord, stringNumber: number, fret: number): number | null {
  const explicit = note.midi ?? note.pitchMidi;
  if (typeof explicit === 'number' && explicit >= 0 && explicit <= 127) return Math.round(explicit);
  const tuningValues = readArray(track.tuningMidi ?? track.tuning);
  const tuning = tuningValues[stringNumber];
  const capoFret = readNumber(track.capoFret, 0);
  if (typeof tuning === 'number') return Math.round(tuning + capoFret + fret);
  if (typeof tuning === 'string') {
    try {
      return midiFromNoteName(tuning) + capoFret + fret;
    } catch {
      return null;
    }
  }
  return null;
}

function durationToBeats(value: unknown, dotted: unknown = 0, tuplet: unknown = null): number {
  if (typeof value === 'number') {
    if (value > 16) return value / 1000;
    return value > 0 ? value : 1;
  }
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const table: Record<string, number> = {
      whole: 4,
      half: 2,
      quarter: 1,
      eighth: 0.5,
      eighthnote: 0.5,
      sixteenth: 0.25,
      '16th': 0.25,
      thirtysecond: 0.125,
      '32nd': 0.125,
    };
    let beats = table[normalized] ?? 1;
    const dotCount = typeof dotted === 'number' ? dotted : readBoolean(dotted) ? 1 : 0;
    let dotValue = beats;
    for (let index = 0; index < dotCount; index += 1) {
      dotValue /= 2;
      beats += dotValue;
    }
    const tuple = asRecord(tuplet);
    const tupleNum = readNumber(tuple.num, 0);
    const tupleDen = readNumber(tuple.den, 0);
    if (tupleNum > 0 && tupleDen > 0) beats *= tupleDen / tupleNum;
    return beats;
  }
  if (value && typeof value === 'object') {
    const record = value as UnknownRecord;
    return durationToBeats(
      record.base ?? record.value ?? record.name,
      record.dotted ?? dotted,
      record.tuplet ?? tuplet,
    );
  }
  return 1;
}

function barDurationFromTimeSignature(signature: unknown, tempo: number): number {
  const parsed = readTimeSignature(signature)?.match(/(\d+)\/(\d+)/);
  if (!parsed) return 4 * 60 / Math.max(tempo, 1);
  return Number(parsed[1]) * (4 / Number(parsed[2])) * 60 / Math.max(tempo, 1);
}

function readTimeSignature(value: unknown): string | undefined {
  if (typeof value === 'string' && value.includes('/')) return value;
  if (value && typeof value === 'object') {
    const record = value as UnknownRecord;
    const numerator = readNumber(record.numerator, readNumber(record.num, 0));
    const denominator = readNumber(record.denominator, readNumber(record.den, 0));
    if (numerator && denominator) return `${numerator}/${denominator}`;
  }
  return undefined;
}

function base64ToBytes(value: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, '');
  const output = new Uint8Array(Math.floor((clean.length * 3) / 4) - (clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0));
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (const character of clean) {
    if (character === '=') break;
    buffer = (buffer << 6) | alphabet.indexOf(character);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[offset] = (buffer >> bits) & 0xff;
      offset += 1;
    }
  }
  return output;
}

function getExtensionlessName(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

function stripExtension(name: string): string {
  return getExtensionlessName(name) || 'Untitled';
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function readRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === 'object' ? (value as UnknownRecord) : undefined;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readTechniques(note: UnknownRecord): PlaybackTechnique[] {
  const techniques: PlaybackTechnique[] = [];
  if (readBoolean(note.hammerOn)) techniques.push('hammer-on');
  if (readBoolean(note.pullOff)) techniques.push('pull-off');
  if (note.bend && typeof note.bend === 'object') techniques.push('bend');
  if (note.slide !== null && note.slide !== undefined) techniques.push('slide');
  if (typeof note.vibrato === 'string' && note.vibrato.trim()) techniques.push('vibrato');
  if (readBoolean(note.palmMute)) techniques.push('palm-mute');
  if (readBoolean(note.letRing)) techniques.push('let-ring');
  if (readBoolean(note.tapped)) techniques.push('tap');
  if (readBoolean(note.muted)) techniques.push('mute');
  if (typeof note.harmonic === 'string' && note.harmonic.trim()) techniques.push('harmonic');

  const tie = readRecord(note.tie);
  if (tie && (readBoolean(tie.origin) || readBoolean(tie.destination))) techniques.push('tie');
  if (note.accent !== null && note.accent !== undefined) techniques.push('accent');
  return techniques;
}

function readDotCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(2, Math.round(value)));
  return readBoolean(value) ? 1 : 0;
}

function readTuplet(value: unknown): { num: number; den: number } | null {
  const tuple = readRecord(value);
  if (!tuple) return null;
  const num = readNumber(tuple.num, 0);
  const den = readNumber(tuple.den, 0);
  return num > 0 && den > 0 ? { num, den } : null;
}

function readBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === 'true';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
