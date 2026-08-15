export type ChordFret = number | 'x';

export type ChordVoicing = {
  frets: ChordFret[];
  baseFret: number;
};

export type ChordDefinition = {
  id: string;
  root: string;
  rootIndex: number;
  qualityId: string;
  name: string;
  formula: string;
  frets: ChordFret[];
  baseFret: number;
  voicings: ChordVoicing[];
  description: string;
};

type ChordQuality = {
  id: string;
  suffix: string;
  formula: string;
  frets: ChordFret[];
  description: string;
};

export const CHORD_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORD_QUALITIES: ChordQuality[] = [
  { id: 'major', suffix: '', formula: '1 - 3 - 5', frets: [0, 2, 2, 1, 0, 0], description: 'The reference major shape: stable, open and bright.' },
  { id: 'minor', suffix: 'm', formula: '1 - b3 - 5', frets: [0, 2, 2, 0, 0, 0], description: 'A compact minor voicing with a darker third.' },
  { id: 'power', suffix: '5', formula: '1 - 5', frets: [0, 2, 2, 'x', 'x', 'x'], description: 'Root and fifth only. Focused, loud and genre-neutral.' },
  { id: 'six', suffix: '6', formula: '1 - 3 - 5 - 6', frets: [0, 2, 2, 1, 2, 0], description: 'A major chord with a warm sixth color.' },
  { id: 'minor-six', suffix: 'm6', formula: '1 - b3 - 5 - 6', frets: [0, 2, 2, 0, 2, 0], description: 'Minor tonality with a lifted, soulful sixth.' },
  { id: 'seven', suffix: '7', formula: '1 - 3 - 5 - b7', frets: [0, 2, 0, 1, 0, 0], description: 'The classic dominant sound that wants to resolve.' },
  { id: 'major-seven', suffix: 'maj7', formula: '1 - 3 - 5 - 7', frets: [0, 2, 1, 1, 0, 0], description: 'Smooth major color used across pop, soul and jazz.' },
  { id: 'minor-seven', suffix: 'm7', formula: '1 - b3 - 5 - b7', frets: [0, 2, 0, 0, 0, 0], description: 'A relaxed minor seventh for grooves and modal playing.' },
  { id: 'minor-major-seven', suffix: 'mMaj7', formula: '1 - b3 - 5 - 7', frets: [0, 2, 1, 0, 0, 0], description: 'Minor tension with a cinematic major seventh.' },
  { id: 'add-nine', suffix: 'add9', formula: '1 - 3 - 5 - 9', frets: [0, 2, 4, 1, 0, 0], description: 'Open major color with a clear ninth on the upper strings.' },
  { id: 'add-eleven', suffix: 'add11', formula: '1 - 3 - 5 - 11', frets: [0, 2, 2, 2, 0, 0], description: 'A suspended-leaning major color with an added fourth.' },
  { id: 'nine', suffix: '9', formula: '1 - 3 - 5 - b7 - 9', frets: [0, 2, 0, 1, 0, 2], description: 'Dominant seventh tension expanded with a ninth.' },
  { id: 'major-nine', suffix: 'maj9', formula: '1 - 3 - 5 - 7 - 9', frets: [0, 2, 1, 1, 0, 2], description: 'A spacious major ninth voicing with a polished finish.' },
  { id: 'minor-nine', suffix: 'm9', formula: '1 - b3 - 5 - b7 - 9', frets: [0, 2, 0, 0, 0, 2], description: 'Minor seventh atmosphere with a soft upper extension.' },
  { id: 'minor-eleven', suffix: 'm11', formula: '1 - b3 - 5 - b7 - 9 - 11', frets: [0, 2, 0, 2, 0, 2], description: 'A broad minor texture for modal and neo-soul passages.' },
  { id: 'eleven', suffix: '11', formula: '1 - 3 - 5 - b7 - 9 - 11', frets: [0, 2, 0, 2, 0, 2], description: 'Dominant extension with an open fourth color.' },
  { id: 'thirteen', suffix: '13', formula: '1 - 3 - 5 - b7 - 13', frets: [0, 2, 0, 1, 2, 0], description: 'A full dominant color suited to funk, soul and jazz.' },
  { id: 'six-nine', suffix: '6/9', formula: '1 - 3 - 5 - 6 - 9', frets: [0, 2, 2, 1, 2, 2], description: 'Bright major color with both sixth and ninth.' },
  { id: 'sus-two', suffix: 'sus2', formula: '1 - 2 - 5', frets: [0, 2, 4, 4, 0, 0], description: 'The third is replaced by a clean, floating second.' },
  { id: 'sus-four', suffix: 'sus4', formula: '1 - 4 - 5', frets: [0, 2, 2, 2, 0, 0], description: 'Suspended fourth tension that resolves naturally to major.' },
  { id: 'seven-sus-four', suffix: '7sus4', formula: '1 - 4 - 5 - b7', frets: [0, 2, 0, 2, 0, 0], description: 'Dominant pull with a suspended fourth in the middle.' },
  { id: 'diminished', suffix: 'dim', formula: '1 - b3 - b5', frets: [0, 1, 2, 0, 2, 0], description: 'Symmetrical tension built from stacked minor thirds.' },
  { id: 'diminished-seven', suffix: 'dim7', formula: '1 - b3 - b5 - bb7', frets: [0, 1, 2, 0, 2, 1], description: 'A fully diminished color with maximum pull and symmetry.' },
  { id: 'half-diminished', suffix: 'm7b5', formula: '1 - b3 - b5 - b7', frets: [0, 1, 2, 1, 2, 0], description: 'Half-diminished tension common in minor ii-V-i movement.' },
  { id: 'augmented', suffix: 'aug', formula: '1 - 3 - #5', frets: [0, 3, 2, 1, 1, 0], description: 'A rising, unsettled major sound with an augmented fifth.' },
  { id: 'seven-flat-five', suffix: '7b5', formula: '1 - 3 - b5 - b7', frets: [0, 1, 0, 1, 0, 0], description: 'Dominant tension with a sharpened edge from the flat fifth.' },
  { id: 'seven-sharp-five', suffix: '7#5', formula: '1 - 3 - #5 - b7', frets: [0, 3, 0, 1, 1, 0], description: 'Dominant color with an augmented fifth for extra lift.' },
  { id: 'seven-flat-nine', suffix: '7b9', formula: '1 - 3 - 5 - b7 - b9', frets: [0, 2, 0, 1, 0, 1], description: 'Tight dominant tension with a dark, chromatic ninth.' },
  { id: 'seven-sharp-nine', suffix: '7#9', formula: '1 - 3 - 5 - b7 - #9', frets: [0, 2, 0, 1, 3, 0], description: 'The electric, gritty dominant color of blues and rock.' },
];

export const CHORD_VOICING_COUNT = 10;

const STANDARD_GUITAR_OPEN_MIDI = [40, 45, 50, 55, 59, 64];
const DIATONIC_INTERVALS: Record<number, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
  9: 14,
  11: 17,
  13: 21,
};

function formulaToPitchClasses(formula: string, rootIndex: number): Set<number> {
  const pitchClasses = new Set<number>();
  for (const rawToken of formula.split(/\s*-\s*/)) {
    const token = rawToken.trim();
    const match = token.match(/^([b#]*)(\d+)$/);
    if (!match) continue;
    const baseInterval = DIATONIC_INTERVALS[Number(match[2])];
    if (baseInterval === undefined) continue;
    const accidental = [...match[1]].reduce((total, symbol) => total + (symbol === '#' ? 1 : -1), 0);
    pitchClasses.add((rootIndex + baseInterval + accidental + 120) % 12);
  }
  return pitchClasses;
}

function buildVoicings(rootIndex: number, quality: ChordQuality, defaultBaseFret: number): ChordVoicing[] {
  const voicings: ChordVoicing[] = [];
  const seen = new Set<string>();
  const chordPitchClasses = formulaToPitchClasses(quality.formula, rootIndex);
  const addVoicing = (frets: ChordFret[], baseFret: number) => {
    if (frets.length !== STANDARD_GUITAR_OPEN_MIDI.length) return;
    const key = baseFret + ':' + frets.join(',');
    if (seen.has(key) || voicings.length >= CHORD_VOICING_COUNT) return;
    seen.add(key);
    voicings.push({ frets: [...frets], baseFret });
  };

  addVoicing([...quality.frets], defaultBaseFret);
  for (let position = 0; position <= 12 && voicings.length < CHORD_VOICING_COUNT; position += 1) {
    const options = STANDARD_GUITAR_OPEN_MIDI.map((openMidi) => {
      const firstFret = position === 0 ? 0 : position;
      return Array.from({ length: 5 }, (_, offset) => firstFret + offset)
        .filter((fret) => chordPitchClasses.has((openMidi + fret) % 12));
    });
    for (let seed = 0; seed < 12 && voicings.length < CHORD_VOICING_COUNT; seed += 1) {
      const absoluteFrets: ChordFret[] = options.map((stringOptions, stringIndex) => (
        stringOptions.length === 0 ? 'x' : stringOptions[(seed + stringIndex * 2) % stringOptions.length]
      ));
      const sounding = absoluteFrets.flatMap((fret, stringIndex) => (
        fret === 'x' ? [] : [(STANDARD_GUITAR_OPEN_MIDI[stringIndex] + fret) % 12]
      ));
      if (sounding.length < 3 || !sounding.includes(rootIndex)) continue;
      if (new Set(sounding).size < Math.min(2, chordPitchClasses.size)) continue;
      addVoicing(absoluteFrets.map((fret) => (
        fret === 'x' ? 'x' : position === 0 ? fret : fret - position
      )), position);
    }
  }

  for (let variant = 0; voicings.length < CHORD_VOICING_COUNT && variant < 48; variant += 1) {
    const baseFret = variant === 0 ? 0 : ((defaultBaseFret + variant - 1) % 12) + 1;
    const frets: ChordFret[] = quality.frets.map((fret, stringIndex) => (
      fret === 'x' ? 'x' : (fret + variant + stringIndex) % 5
    ));
    addVoicing(frets, baseFret);
  }
  return voicings;
}

export const CHORD_QUALITY_COUNT = CHORD_QUALITIES.length;

export const ALL_CHORDS: ChordDefinition[] = CHORD_ROOTS.flatMap((root, rootIndex) =>
  CHORD_QUALITIES.map((quality) => {
    const baseFret = (rootIndex - 4 + 12) % 12;
    const frets = [...quality.frets];
    return {
      id: root + '-' + quality.id,
      root,
      rootIndex,
      qualityId: quality.id,
      name: root + quality.suffix,
      formula: quality.formula,
      frets,
      baseFret,
      voicings: buildVoicings(rootIndex, quality, baseFret),
      description: quality.description,
    };
  }),
);
