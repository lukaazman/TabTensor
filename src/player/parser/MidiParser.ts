import * as FileSystem from 'expo-file-system/legacy';
import { GuitarProSong, PlaybackBeat, PlaybackMeasure, PlaybackNote, PlaybackTrack, PlayerCapabilities } from '@/types';
import { formatForFile } from './FileFormats';
import { readFileBytes, utf8FromBytes } from './binary';
import { gmInstrumentName, waveformForProgram } from './instruments';

type MidiTempoEvent = { tick: number; tempo: number };
type MidiTimeSignature = { tick: number; numerator: number; denominator: number };
type MidiLyric = { tick: number; text: string };

type MidiNoteEvent = {
  startTick: number;
  endTick: number;
  midi: number;
  velocity: number;
  channel: number;
  program: number;
};

type MidiTrackData = {
  name?: string;
  notes: MidiNoteEvent[];
  lyrics: MidiLyric[];
  maxTick: number;
};

type MidiMeasure = {
  index: number;
  startTick: number;
  endTick: number;
  timeSignature: string;
};

type MidiActiveNote = MidiNoteEvent;

export async function parseMidiFile(uri: string, sourceName: string): Promise<GuitarProSong> {
  if (formatForFile(sourceName) !== 'midi') {
    throw new Error('Unsupported file. Select a MIDI file ending in .mid or .midi.');
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error('This file is no longer available on the device.');

  try {
    const bytes = await readFileBytes(uri);
    const header = new MidiReader(bytes);
    if (header.readAscii(4) !== 'MThd') throw new Error('The file does not contain a valid MIDI header.');
    const headerLength = header.readUint32();
    const midiFormat = header.readUint16();
    const trackCount = header.readUint16();
    const division = header.readUint16();
    if (headerLength > 6) header.skip(headerLength - 6);
    if (midiFormat > 2) throw new Error('This MIDI format is not supported.');
    if (division & 0x8000) throw new Error('SMPTE-timed MIDI files are not supported; use a PPQ-timed MIDI export.');
    const ticksPerQuarter = Math.max(1, division);

    const tracks: MidiTrackData[] = [];
    const tempoEvents: MidiTempoEvent[] = [];
    const timeSignatures: MidiTimeSignature[] = [];
    let maxTick = 0;
    for (let trackIndex = 0; trackIndex < trackCount && header.remaining() >= 8; trackIndex += 1) {
      const chunk = header.readAscii(4);
      const length = header.readUint32();
      if (chunk !== 'MTrk') {
        header.skip(length);
        continue;
      }
      const trackEnd = Math.min(bytes.length, header.position + length);
      const parsed = parseTrack(new MidiReader(bytes, header.position, trackEnd), trackIndex, tempoEvents, timeSignatures);
      tracks.push(parsed);
      maxTick = Math.max(maxTick, parsed.maxTick);
      header.position = trackEnd;
    }

    const allRawNotes = tracks.flatMap((track) => track.notes);
    if (!allRawNotes.length) throw new Error('The MIDI file contains no playable notes.');
    maxTick = Math.max(maxTick, ...allRawNotes.map((note) => note.endTick));

    const normalizedTempoEvents = dedupeTempoEvents(tempoEvents, ticksPerQuarter);
    const secondsAtTick = createSecondsAtTick(normalizedTempoEvents, ticksPerQuarter);
    const measures = buildMidiMeasures(maxTick, timeSignatures, ticksPerQuarter);
    const normalizedTracks = normalizeTracks(tracks, secondsAtTick, measures);
    const allNotes = normalizedTracks.flatMap((track) => track.notes);
    const normalizedMeasures = buildMeasures(measures, normalizedTracks, secondsAtTick);
    const duration = Math.max(secondsAtTick(maxTick), ...allNotes.map((note) => note.start + note.duration));
    const hasLyrics = allNotes.some((note) => Boolean(note.lyric));
    const hasPercussion = normalizedTracks.some((track) => Boolean(track.isPercussion));
    const capabilities: PlayerCapabilities = {
      tablature: false,
      staffNotation: true,
      lyrics: hasLyrics,
      dynamics: false,
      tempoMap: normalizedTempoEvents.length > 1,
      velocity: true,
      instruments: normalizedTracks.some((track) => track.midiProgram !== undefined),
      percussion: hasPercussion,
    };
    const firstTrackName = tracks.find((track) => track.name?.trim())?.name;

    return {
      id: `${uri}:${sourceName}`,
      title: firstTrackName || stripExtension(sourceName),
      artist: '',
      tempo: normalizedTempoEvents[0]?.tempo ?? 120,
      duration,
      timeSignature: normalizedMeasures[0]?.timeSignature,
      sourceUri: uri,
      sourceName,
      format: 'MIDI',
      formatKind: 'midi',
      capabilities,
      tracks: normalizedTracks,
      measures: normalizedMeasures,
    };
  } catch (reason: unknown) {
    const detail = reason instanceof Error ? reason.message : 'The file could not be decoded.';
    throw new Error(`Failed to parse MIDI file: ${detail}`);
  }
}

function parseTrack(reader: MidiReader, trackIndex: number, tempoEvents: MidiTempoEvent[], timeSignatures: MidiTimeSignature[]): MidiTrackData {
  let tick = 0;
  let runningStatus = 0;
  let trackName: string | undefined;
  let maxTick = 0;
  const programs = Array.from({ length: 16 }, () => 0);
  const sustain = Array.from({ length: 16 }, () => false);
  const active = new Map<string, MidiActiveNote[]>();
  const sustained = new Map<string, MidiActiveNote[]>();
  const notes: MidiNoteEvent[] = [];
  const lyrics: MidiLyric[] = [];

  const finish = (note: MidiActiveNote, endTick: number) => {
    notes.push({ ...note, endTick: Math.max(endTick, note.startTick + 1) });
  };
  const finishKey = (key: string, endTick: number, useSustained: boolean) => {
    const list = (useSustained ? sustained : active).get(key);
    const note = list?.shift();
    if (note) finish(note, endTick);
    if (list?.length === 0) (useSustained ? sustained : active).delete(key);
  };
  const finishChannelSustain = (channel: number, endTick: number) => {
    [...sustained.keys()].filter((key) => key.startsWith(`${channel}:`)).forEach((key) => {
      while (sustained.has(key)) finishKey(key, endTick, true);
    });
  };

  while (reader.remaining() > 0) {
    tick += reader.readVlq();
    maxTick = Math.max(maxTick, tick);
    let status = reader.readByte();
    if (status < 0x80) {
      if (!runningStatus) throw new Error(`Invalid running status in MIDI track ${trackIndex + 1}.`);
      reader.position -= 1;
      status = runningStatus;
    } else if (status < 0xf0) {
      runningStatus = status;
    }

    if (status === 0xff) {
      const metaType = reader.readByte();
      const length = reader.readVlq();
      const data = reader.readBytes(length);
      if (metaType === 0x2f) break;
      if (metaType === 0x03) trackName = utf8FromBytes(data).trim() || trackName;
      if (metaType === 0x01 || metaType === 0x05) lyrics.push({ tick, text: utf8FromBytes(data).trim() });
      if (metaType === 0x51 && data.length >= 3) {
        const micros = (data[0] << 16) | (data[1] << 8) | data[2];
        if (micros > 0) tempoEvents.push({ tick, tempo: 60000000 / micros });
      }
      if (metaType === 0x58 && data.length >= 2) {
        const numerator = data[0];
        const denominator = Math.pow(2, data[1]);
        if (numerator > 0 && denominator > 0) timeSignatures.push({ tick, numerator, denominator });
      }
      continue;
    }
    if (status === 0xf0 || status === 0xf7) {
      reader.skip(reader.readVlq());
      continue;
    }

    const command = status >> 4;
    const channel = status & 0x0f;
    const first = reader.readByte();
    if (command === 0xc || command === 0xd) {
      if (command === 0xc) programs[channel] = first;
      continue;
    }
    const second = reader.readByte();
    if (command === 0x9 && second > 0) {
      const note: MidiActiveNote = { startTick: tick, endTick: tick + 1, midi: first, velocity: second, channel, program: programs[channel] };
      const key = `${channel}:${first}`;
      active.set(key, [...(active.get(key) ?? []), note]);
      continue;
    }
    if (command === 0x8 || (command === 0x9 && second === 0)) {
      const key = `${channel}:${first}`;
      if (sustain[channel]) {
        const note = active.get(key)?.shift();
        if (note) sustained.set(key, [...(sustained.get(key) ?? []), note]);
        if (active.get(key)?.length === 0) active.delete(key);
      } else {
        finishKey(key, tick, false);
      }
      continue;
    }
    if (command === 0xb && first === 64) {
      const nextSustain = second >= 64;
      if (sustain[channel] && !nextSustain) finishChannelSustain(channel, tick);
      sustain[channel] = nextSustain;
    }
  }

  [...active.values(), ...sustained.values()].forEach((list) => list.forEach((note) => finish(note, maxTick)));
  return { name: trackName, notes, lyrics, maxTick };
}

function normalizeTracks(tracks: MidiTrackData[], secondsAtTick: (tick: number) => number, measures: MidiMeasure[]): PlaybackTrack[] {
  const normalized: PlaybackTrack[] = [];
  tracks.forEach((track, trackIndex) => {
    const channels = [...new Set(track.notes.map((note) => note.channel))].sort((a, b) => a - b);
    channels.forEach((channel) => {
      const channelNotes = track.notes.filter((note) => note.channel === channel);
      const program = channelNotes[0]?.program ?? 0;
      const percussion = channel === 9;
      const name = track.name || `Track ${trackIndex + 1}`;
      const displayName = channels.length > 1 ? `${name} · CH ${channel + 1}` : name;
      const beatIndices = new Map<string, number>();
      const notes: PlaybackNote[] = channelNotes.map((note, noteIndex) => {
        const measureIndex = measureIndexForTick(note.startTick, measures);
        const beatKey = `${measureIndex}:${note.startTick}`;
        if (!beatIndices.has(beatKey)) beatIndices.set(beatKey, [...beatIndices.keys()].filter((key) => key.startsWith(`${measureIndex}:`)).length);
        const start = secondsAtTick(note.startTick);
        const lyric = track.lyrics.find((candidate) => candidate.tick >= note.startTick && candidate.tick < note.endTick)?.text;
        return {
          id: `${trackIndex}-${channel}-${noteIndex}`,
          midi: note.midi,
          fret: -1,
          stringNumber: 0,
          start,
          duration: Math.max(0.04, secondsAtTick(note.endTick) - start),
          velocity: Math.max(0.05, Math.min(1, note.velocity / 127)),
          measureIndex,
          beatIndex: beatIndices.get(beatKey) ?? 0,
          techniques: [],
          lyric,
          isPercussion: percussion,
        };
      });
      normalized.push({
        id: `track-${trackIndex}-${channel}`,
        name: displayName,
        instrument: percussion ? 'Percussion' : gmInstrumentName(program),
        midiProgram: program,
        isPercussion: percussion,
        waveform: waveformForProgram(program, percussion),
        tablature: false,
        volume: 1,
        muted: false,
        notes,
      });
    });
  });
  return normalized;
}

function buildMidiMeasures(maxTick: number, timeSignatures: MidiTimeSignature[], ticksPerQuarter: number): MidiMeasure[] {
  const signatures = [{ tick: 0, numerator: 4, denominator: 4 }, ...timeSignatures].sort((a, b) => a.tick - b.tick);
  const result: MidiMeasure[] = [];
  let cursor = 0;
  let signatureIndex = 0;
  let guard = 0;
  while ((cursor <= maxTick || !result.length) && guard < 10000) {
    guard += 1;
    while (signatureIndex + 1 < signatures.length && signatures[signatureIndex + 1].tick <= cursor) signatureIndex += 1;
    const signature = signatures[signatureIndex];
    const nextSignatureTick = signatures[signatureIndex + 1]?.tick;
    const regularLength = signature.numerator * (4 / signature.denominator) * ticksPerQuarter;
    const end = Math.max(cursor + 1, nextSignatureTick !== undefined && nextSignatureTick > cursor && nextSignatureTick < cursor + regularLength ? nextSignatureTick : cursor + regularLength);
    result.push({ index: result.length, startTick: cursor, endTick: end, timeSignature: `${signature.numerator}/${signature.denominator}` });
    cursor = end;
  }
  return result;
}

function buildMeasures(measures: MidiMeasure[], tracks: PlaybackTrack[], secondsAtTick: (tick: number) => number): PlaybackMeasure[] {
  return measures.map((measure) => {
    const start = secondsAtTick(measure.startTick);
    const end = secondsAtTick(measure.endTick);
    const notes = tracks.flatMap((track) => track.notes.filter((note) => note.measureIndex === measure.index));
    const starts = [...new Set(notes.map((note) => note.start))].sort((a, b) => a - b);
    const endSeconds = notes.length ? Math.max(...notes.map((note) => note.start + note.duration)) : 0;
    const firstStart = notes[0]?.start ?? 0;
    const measureStart = start;
    const beats: PlaybackBeat[] = starts.map((beatStart, beatIndex) => ({
      index: beatIndex,
      start: beatStart,
      duration: Math.max(0.04, Math.min(Math.max(endSeconds - beatStart, 0.25), Math.max(...notes.filter((note) => note.start === beatStart).map((note) => note.duration), 0.25))),
      notes: notes.filter((note) => note.start === beatStart),
      isRest: false,
      dotted: 0,
      tuplet: null,
    }));
    if (!beats.length) beats.push({ index: 0, start: firstStart, duration: 0.25, notes: [], isRest: true, dotted: 0, tuplet: null });
    return {
      index: measure.index,
      start: measureStart,
      duration: Math.max(0.1, end - measureStart, endSeconds - measureStart),
      timeSignature: measure.timeSignature,
      beats,
    };
  });
}

function measureIndexForTick(tick: number, measures: MidiMeasure[]): number {
  const measure = measures.find((candidate) => tick >= candidate.startTick && tick < candidate.endTick);
  return measure?.index ?? Math.max(0, measures.length - 1);
}

function dedupeTempoEvents(events: MidiTempoEvent[], ticksPerQuarter: number): MidiTempoEvent[] {
  const sorted = [{ tick: 0, tempo: 120 }, ...events].sort((a, b) => a.tick - b.tick);
  const result: MidiTempoEvent[] = [];
  sorted.forEach((event) => {
    const previous = result.at(-1);
    if (previous?.tick === event.tick) previous.tempo = event.tempo;
    else result.push({ tick: Math.max(0, event.tick), tempo: Math.max(1, event.tempo) });
  });
  return result.length ? result : [{ tick: 0, tempo: 120 / Math.max(1, ticksPerQuarter / ticksPerQuarter) }];
}

function createSecondsAtTick(events: MidiTempoEvent[], ticksPerQuarter: number): (tick: number) => number {
  return (tick: number) => {
    let seconds = 0;
    let cursor = 0;
    let tempo = events[0]?.tempo ?? 120;
    for (const event of events) {
      if (event.tick > tick) break;
      seconds += (event.tick - cursor) * 60 / (tempo * ticksPerQuarter);
      cursor = event.tick;
      tempo = event.tempo;
    }
    return seconds + Math.max(0, tick - cursor) * 60 / (tempo * ticksPerQuarter);
  };
}

class MidiReader {
  constructor(private readonly bytes: Uint8Array, public position = 0, private readonly end = bytes.length) {}

  remaining(): number { return Math.max(0, this.end - this.position); }

  readByte(): number {
    if (this.position >= this.end) throw new Error('Unexpected end of MIDI data.');
    return this.bytes[this.position++];
  }

  readUint16(): number {
    return (this.readByte() << 8) | this.readByte();
  }

  readUint32(): number {
    return (this.readByte() * 0x1000000) + (this.readByte() << 16) + (this.readByte() << 8) + this.readByte();
  }

  readVlq(): number {
    let value = 0;
    for (let count = 0; count < 4; count += 1) {
      const byte = this.readByte();
      value = (value << 7) | (byte & 0x7f);
      if (!(byte & 0x80)) return value;
    }
    throw new Error('Invalid variable-length MIDI value.');
  }

  readAscii(length: number): string {
    return String.fromCharCode(...this.readBytes(length));
  }

  readBytes(length: number): Uint8Array {
    if (length < 0 || this.position + length > this.end) throw new Error('Unexpected end of MIDI data.');
    const result = this.bytes.slice(this.position, this.position + length);
    this.position += length;
    return result;
  }

  skip(length: number): void {
    this.position = Math.min(this.end, this.position + Math.max(0, length));
  }
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '') || 'Untitled';
}
