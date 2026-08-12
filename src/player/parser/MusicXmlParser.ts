import * as FileSystem from 'expo-file-system/legacy';
import { DOMParser as LinkedomDOMParser } from 'linkedom';
import { GuitarProSong, PlaybackBeat, PlaybackMeasure, PlaybackNote, PlaybackTechnique, PlaybackTrack, PlayerCapabilities } from '@/types';
import { getExtension, formatForFile } from './FileFormats';
import { readFileBytes, utf8FromBytes } from './binary';
import { gmInstrumentName, waveformForProgram } from './instruments';

const TICKS_PER_QUARTER = 480;

type XmlNode = {
  nodeName?: string;
  localName?: string;
  textContent?: string | null;
  children?: ArrayLike<XmlNode>;
  childNodes?: ArrayLike<XmlNode>;
  documentElement?: XmlNode;
  getAttribute?: (name: string) => string | null;
};

type XmlNoteEvent = {
  id: string;
  startTick: number;
  durationTicks: number;
  midi: number;
  fret: number;
  stringNumber: number;
  measureIndex: number;
  beatIndex: number;
  velocity: number;
  techniques: PlaybackTechnique[];
  lyric?: string;
  dynamic?: string;
};

type XmlMeasure = {
  index: number;
  startTick: number;
  durationTicks: number;
  timeSignature?: string;
};

type XmlTempoEvent = {
  tick: number;
  tempo: number;
};

type XmlPart = {
  id: string;
  name: string;
  instrument?: string;
  midiProgram?: number;
  isPercussion: boolean;
  notes: XmlNoteEvent[];
  measures: XmlMeasure[];
};

type PartMetadata = {
  name: string;
  instrument?: string;
  midiProgram?: number;
  isPercussion: boolean;
};

export async function parseMusicXmlFile(uri: string, sourceName: string): Promise<GuitarProSong> {
  if (formatForFile(sourceName) !== 'musicxml') {
    throw new Error('Unsupported file. Select a MusicXML file ending in .musicxml or .xml.');
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error('This file is no longer available on the device.');

  try {
    const xml = utf8FromBytes(await readFileBytes(uri));
    const documentNode = new LinkedomDOMParser().parseFromString(xml, 'text/xml') as unknown as XmlNode;
    const root = documentNode.documentElement ?? documentNode;
    if (nodeName(root) !== 'score-partwise') {
      throw new Error('This MusicXML file is not a score-partwise document. Export it as uncompressed score-partwise MusicXML.');
    }

    const metadata = readPartMetadata(root);
    const xmlParts = directChildren(root, 'part');
    if (!xmlParts.length) throw new Error('No parts detected in this MusicXML file.');

    const firstParsed = parsePart(xmlParts[0], 0, metadata, undefined);
    const measures = firstParsed.measures;
    const parsedParts = [firstParsed, ...xmlParts.slice(1).map((part, index) => parsePart(part, index + 1, metadata, measures))];
    const tempoEvents = dedupeTempoEvents(parsedParts.flatMap((part) => part.tempoEvents ?? []));
    const secondsAtTick = createSecondsAtTick(tempoEvents);
    const tracks = parsedParts.map((part, partIndex) => normalizePart(part, partIndex, secondsAtTick));
    const allNotes = tracks.flatMap((track) => track.notes);
    if (!allNotes.length) throw new Error('The MusicXML file contains no playable pitched notes.');

    const normalizedMeasures = buildMeasures(measures, tracks, secondsAtTick);
    const finalMeasure = normalizedMeasures.at(-1);
    const duration = Math.max(
      finalMeasure ? finalMeasure.start + finalMeasure.duration : 0,
      ...allNotes.map((note) => note.start + note.duration),
    );
    const title = firstDescendantText(root, 'work-title')
      ?? firstText(root, 'movement-title')
      ?? stripExtension(sourceName);
    const artist = firstDescendantText(root, 'creator') ?? '';
    const capabilities: PlayerCapabilities = {
      tablature: allNotes.some((note) => note.fret >= 0),
      staffNotation: true,
      lyrics: allNotes.some((note) => Boolean(note.lyric)),
      dynamics: allNotes.some((note) => Boolean(note.dynamic)),
      tempoMap: tempoEvents.length > 1,
      velocity: true,
      instruments: tracks.some((track) => Boolean(track.instrument || track.midiProgram !== undefined)),
      percussion: tracks.some((track) => Boolean(track.isPercussion)),
    };

    return {
      id: `${uri}:${sourceName}`,
      title: title || stripExtension(sourceName),
      artist,
      tempo: tempoEvents[0]?.tempo ?? 120,
      duration,
      timeSignature: measures[0]?.timeSignature,
      sourceUri: uri,
      sourceName,
      format: 'MUSICXML',
      formatKind: 'musicxml',
      capabilities,
      tracks,
      measures: normalizedMeasures,
    };
  } catch (reason: unknown) {
    const detail = reason instanceof Error ? reason.message : 'The file could not be decoded.';
    throw new Error(`Failed to parse MusicXML file: ${detail}`);
  }
}

function parsePart(partNode: XmlNode, partIndex: number, metadata: Map<string, PartMetadata>, sharedMeasures?: XmlMeasure[]): XmlPart & { tempoEvents: XmlTempoEvent[] } {
  const id = attribute(partNode, 'id') ?? `P${partIndex + 1}`;
  const partMetadata = metadata.get(id) ?? { name: `Part ${partIndex + 1}`, isPercussion: false };
  const notes: XmlNoteEvent[] = [];
  const measures: XmlMeasure[] = [];
  const tempoEvents: XmlTempoEvent[] = [];
  let divisions = 1;
  let timeSignature: string | undefined;
  let measureCursor = 0;
  let currentDynamic: string | undefined;
  let noteSequence = 0;

  directChildren(partNode, 'measure').forEach((measureNode, measureIndex) => {
    const attributes = directChild(measureNode, 'attributes');
    const nextDivisions = number(textOf(attributes, 'divisions'), divisions);
    if (nextDivisions > 0) divisions = nextDivisions;
    const nextTimeSignature = readTimeSignature(directChild(attributes, 'time'));
    if (nextTimeSignature) timeSignature = nextTimeSignature;

    let cursor = 0;
    let maxCursor = 0;
    let lastNoteStart = measureCursor;
    const beatStarts = new Map<number, number>();

    directChildren(measureNode).forEach((item) => {
      const name = nodeName(item);
      if (name === 'direction') {
        const direction = readDirection(item);
        if (direction.tempo) tempoEvents.push({ tick: measureCursor + Math.max(0, number(textOf(directChild(item, 'offset')), 0) / divisions * TICKS_PER_QUARTER), tempo: direction.tempo });
        if (direction.dynamic) currentDynamic = direction.dynamic;
        return;
      }
      if (name === 'backup' || name === 'forward') {
        const amount = number(textOf(item, 'duration'), 0) / divisions * TICKS_PER_QUARTER;
        cursor = name === 'backup' ? Math.max(0, cursor - amount) : cursor + amount;
        maxCursor = Math.max(maxCursor, cursor);
        return;
      }
      if (name !== 'note') return;

      const durationDivisions = number(textOf(item, 'duration'), durationFromType(textOf(item, 'type')) * divisions);
      const durationTicks = Math.max(1, Math.round(durationDivisions / divisions * TICKS_PER_QUARTER));
      const isChord = Boolean(directChild(item, 'chord'));
      const startTick = measureCursor + (isChord ? lastNoteStart - measureCursor : cursor);
      const isRest = Boolean(directChild(item, 'rest'));
      if (!isRest) {
        const midi = midiFromMusicXmlNote(item);
        if (midi !== null) {
          const technical = directChild(directChild(item, 'notations'), 'technical');
          const fretValue = number(textOf(technical, 'fret'), -1);
          const stringValue = number(textOf(technical, 'string'), 1);
          const event: XmlNoteEvent = {
            id: `${partIndex}-${measureIndex}-${noteSequence++}`,
            startTick,
            durationTicks,
            midi,
            fret: fretValue >= 0 ? fretValue : -1,
            stringNumber: Math.max(0, stringValue - 1),
            measureIndex,
            beatIndex: 0,
            velocity: velocityForDynamic(currentDynamic),
            techniques: readMusicXmlTechniques(item),
            lyric: readLyric(item),
            dynamic: currentDynamic,
          };
          notes.push(event);
          if (!beatStarts.has(startTick)) beatStarts.set(startTick, beatStarts.size);
          event.beatIndex = beatStarts.get(startTick) ?? 0;
        }
      }
      if (!isChord) {
        cursor += durationTicks;
        lastNoteStart = measureCursor + cursor - durationTicks;
      }
      maxCursor = Math.max(maxCursor, cursor, startTick - measureCursor + durationTicks);
    });

    const expectedDuration = timeSignature ? timeSignatureTicks(timeSignature) : 4 * TICKS_PER_QUARTER;
    const parsedDuration = Math.max(expectedDuration, maxCursor, 1);
    const sharedMeasure = sharedMeasures?.[measureIndex];
    measures.push(sharedMeasure ?? {
      index: measureIndex,
      startTick: measureCursor,
      durationTicks: parsedDuration,
      timeSignature,
    });
    measureCursor += sharedMeasure?.durationTicks ?? parsedDuration;
  });

  return { id, ...partMetadata, notes, measures, tempoEvents };
}

function normalizePart(part: XmlPart, partIndex: number, secondsAtTick: (tick: number) => number): PlaybackTrack {
  return {
    id: part.id || `part-${partIndex}`,
    name: part.name,
    instrument: part.instrument ?? (part.midiProgram !== undefined ? gmInstrumentName(part.midiProgram) : undefined),
    midiProgram: part.midiProgram,
    isPercussion: part.isPercussion,
    waveform: waveformForProgram(part.midiProgram ?? 0, part.isPercussion),
    tablature: part.notes.some((note) => note.fret >= 0),
    volume: 1,
    muted: false,
    notes: part.notes.map((note) => {
      const start = secondsAtTick(note.startTick);
      return {
        id: note.id,
        midi: note.midi,
        fret: note.fret,
        stringNumber: note.stringNumber,
        start,
        duration: Math.max(0.04, secondsAtTick(note.startTick + note.durationTicks) - start),
        velocity: note.velocity,
        measureIndex: note.measureIndex,
        beatIndex: note.beatIndex,
        techniques: note.techniques,
        lyric: note.lyric,
        dynamic: note.dynamic,
        isPercussion: part.isPercussion,
      };
    }),
  };
}

function buildMeasures(xmlMeasures: XmlMeasure[], tracks: PlaybackTrack[], secondsAtTick: (tick: number) => number): PlaybackMeasure[] {
  return xmlMeasures.map((measure) => {
    const start = secondsAtTick(measure.startTick);
    const end = secondsAtTick(measure.startTick + measure.durationTicks);
    const notes = tracks.flatMap((track) => track.notes.filter((note) => note.measureIndex === measure.index));
    const starts = [...new Set(notes.map((note) => note.start))].sort((a, b) => a - b);
    const beats: PlaybackBeat[] = starts.map((beatStart, beatIndex) => ({
      index: beatIndex,
      start: beatStart,
      duration: Math.max(0.04, Math.min(end - beatStart, Math.max(...notes.filter((note) => note.start === beatStart).map((note) => note.duration), 0.25))),
      notes: notes.filter((note) => note.start === beatStart),
      isRest: false,
      dotted: 0,
      tuplet: null,
    }));
    if (!beats.length) beats.push({ index: 0, start, duration: Math.max(0.04, end - start), notes: [], isRest: true, dotted: 0, tuplet: null });
    return {
      index: measure.index,
      start,
      duration: Math.max(0.1, end - start),
      timeSignature: measure.timeSignature,
      beats,
    };
  });
}

function readPartMetadata(root: XmlNode): Map<string, PartMetadata> {
  const result = new Map<string, PartMetadata>();
  const partList = directChild(root, 'part-list');
  directChildren(partList, 'score-part').forEach((scorePart) => {
    const id = attribute(scorePart, 'id');
    if (!id) return;
    const midiInstrument = firstDescendant(scorePart, 'midi-instrument');
    const channel = number(textOf(midiInstrument, 'midi-channel'), 0);
    const programValue = number(textOf(midiInstrument, 'midi-program'), 0);
    const midiProgram = programValue > 0 ? programValue - 1 : undefined;
    result.set(id, {
      name: firstText(scorePart, 'part-name') ?? `Part ${id}`,
      instrument: firstDescendantText(scorePart, 'instrument-name') ?? undefined,
      midiProgram,
      isPercussion: channel === 10,
    });
  });
  return result;
}

function readDirection(direction: XmlNode): { tempo?: number; dynamic?: string } {
  const sound = firstDescendant(direction, 'sound');
  const metronome = firstDescendant(direction, 'metronome');
  const soundTempo = number(attribute(sound, 'tempo'), 0);
  const metronomeTempo = number(firstText(metronome, 'per-minute'), 0);
  const dynamics = firstDescendant(direction, 'dynamics');
  const dynamic = dynamics ? directChildren(dynamics)[0] : undefined;
  return {
    tempo: soundTempo > 0 ? soundTempo : metronomeTempo > 0 ? metronomeTempo : undefined,
    dynamic: dynamic ? nodeName(dynamic).toLowerCase() : undefined,
  };
}

function midiFromMusicXmlNote(note: XmlNode): number | null {
  const pitch = directChild(note, 'pitch');
  if (pitch) {
    const step = (firstText(pitch, 'step') ?? '').toUpperCase();
    const octave = number(firstText(pitch, 'octave'), -1);
    const alter = Math.round(number(firstText(pitch, 'alter'), 0));
    const base = ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as Record<string, number>)[step];
    if (base !== undefined && octave >= 0) return Math.max(0, Math.min(127, (octave + 1) * 12 + base + alter));
  }
  const unpitched = directChild(note, 'unpitched');
  if (unpitched) {
    const step = (firstText(unpitched, 'display-step') ?? 'C').toUpperCase();
    const octave = number(firstText(unpitched, 'display-octave'), 4);
    const base = ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as Record<string, number>)[step] ?? 0;
    return Math.max(0, Math.min(127, (octave + 1) * 12 + base));
  }
  return null;
}

function readMusicXmlTechniques(note: XmlNode): PlaybackTechnique[] {
  const techniques: PlaybackTechnique[] = [];
  const add = (technique: PlaybackTechnique, condition: boolean) => { if (condition && !techniques.includes(technique)) techniques.push(technique); };
  const notations = directChild(note, 'notations');
  const technical = directChild(notations, 'technical');
  add('hammer-on', Boolean(firstDescendant(technical, 'hammer-on')));
  add('pull-off', Boolean(firstDescendant(technical, 'pull-off')));
  add('bend', Boolean(firstDescendant(technical, 'bend')));
  add('slide', Boolean(firstDescendant(technical, 'slide')));
  add('harmonic', Boolean(firstDescendant(technical, 'harmonic')));
  add('tremolo', Boolean(firstDescendant(technical, 'tremolo')));
  add('pizzicato', Boolean(firstDescendant(technical, 'pluck')) || Boolean(firstDescendant(technical, 'pizzicato')));
  add('up-bow', Boolean(firstDescendant(technical, 'up-bow')));
  add('down-bow', Boolean(firstDescendant(technical, 'down-bow')));
  add('tie', directChildren(note, 'tie').length > 0 || Boolean(firstDescendant(notations, 'tied')));
  const articulations = firstDescendant(notations, 'articulations');
  add('accent', Boolean(firstDescendant(articulations, 'accent')));
  add('staccato', Boolean(firstDescendant(articulations, 'staccato')));
  add('tenuto', Boolean(firstDescendant(articulations, 'tenuto')));
  add('marcato', Boolean(firstDescendant(articulations, 'strong-accent')));
  add('fermata', Boolean(firstDescendant(notations, 'fermata')));
  return techniques;
}

function readLyric(note: XmlNode): string | undefined {
  const lyric = directChild(note, 'lyric');
  const value = firstText(lyric, 'text')?.trim();
  return value || undefined;
}

function velocityForDynamic(dynamic?: string): number {
  const values: Record<string, number> = { ppp: 0.35, pp: 0.45, p: 0.55, mp: 0.65, mf: 0.78, f: 0.88, ff: 0.96, fff: 1 };
  return values[dynamic ?? 'mf'] ?? 0.78;
}

function dedupeTempoEvents(events: XmlTempoEvent[]): XmlTempoEvent[] {
  const sorted = [{ tick: 0, tempo: 120 }, ...events].sort((a, b) => a.tick - b.tick);
  const result: XmlTempoEvent[] = [];
  sorted.forEach((event) => {
    const previous = result.at(-1);
    if (previous?.tick === event.tick) previous.tempo = event.tempo;
    else result.push({ ...event });
  });
  return result;
}

function createSecondsAtTick(events: XmlTempoEvent[]): (tick: number) => number {
  return (tick: number) => {
    let seconds = 0;
    let cursor = 0;
    let tempo = events[0]?.tempo ?? 120;
    for (const event of events) {
      if (event.tick > tick) break;
      seconds += (event.tick - cursor) * 60 / (tempo * TICKS_PER_QUARTER);
      cursor = event.tick;
      tempo = event.tempo;
    }
    return seconds + Math.max(0, tick - cursor) * 60 / (tempo * TICKS_PER_QUARTER);
  };
}

function timeSignatureTicks(signature: string): number {
  const match = signature.match(/(\d+)\/(\d+)/);
  if (!match) return 4 * TICKS_PER_QUARTER;
  return Number(match[1]) * (4 / Number(match[2])) * TICKS_PER_QUARTER;
}

function durationFromType(value?: string): number {
  const durations: Record<string, number> = { whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25, '32nd': 0.125 };
  return durations[value?.toLowerCase() ?? 'quarter'] ?? 1;
}

function readTimeSignature(time?: XmlNode | null): string | undefined {
  if (!time) return undefined;
  const beats = firstText(time, 'beats');
  const beatType = firstText(time, 'beat-type');
  return beats && beatType ? `${beats}/${beatType}` : undefined;
}

function nodeName(node?: XmlNode | null): string {
  return (node?.localName ?? node?.nodeName ?? '').split(':').pop()?.toLowerCase() ?? '';
}

function directChildren(parent?: XmlNode | null, name?: string): XmlNode[] {
  if (!parent) return [];
  const list = parent.children ?? parent.childNodes ?? [];
  return Array.from(list).filter((child) => Boolean(child && (!name || nodeName(child) === name.toLowerCase())));
}

function directChild(parent?: XmlNode | null, name?: string): XmlNode | undefined {
  return directChildren(parent, name)[0];
}

function firstDescendant(parent?: XmlNode | null, name?: string): XmlNode | undefined {
  if (!parent) return undefined;
  for (const child of directChildren(parent)) {
    if (!name || nodeName(child) === name.toLowerCase()) return child;
    const nested = firstDescendant(child, name);
    if (nested) return nested;
  }
  return undefined;
}

function firstText(parent?: XmlNode | null, name?: string): string | undefined {
  const child = directChild(parent, name);
  const value = child?.textContent?.trim();
  return value || undefined;
}

function firstDescendantText(parent?: XmlNode | null, name?: string): string | undefined {
  const child = firstDescendant(parent, name);
  const value = child?.textContent?.trim();
  return value || undefined;
}

function textOf(parent?: XmlNode | null, name?: string): string | undefined {
  return firstText(parent, name);
}

function attribute(node: XmlNode | undefined, name: string): string | undefined {
  const value = node?.getAttribute?.(name);
  return value?.trim() || undefined;
}

function number(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? NaN : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '') || 'Untitled';
}
