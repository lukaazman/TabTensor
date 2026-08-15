import { CHORD_ROOTS } from './chords';

export type ScaleGenre = 'POPULAR' | 'BLUES / ROCK' | 'JAZZ / FUNK' | 'METAL / FLAMENCO' | 'WORLD';

export type ScaleDefinition = {
  id: string;
  name: string;
  genre: ScaleGenre;
  formula: string;
  degrees: string[];
  intervals: number[];
  description: string;
  use: string;
};

export const SCALE_ROOTS = CHORD_ROOTS;

export const SCALE_CATALOG: ScaleDefinition[] = [
  {
    id: 'major',
    name: 'Major / Ionian',
    genre: 'POPULAR',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    degrees: ['1', '2', '3', '4', '5', '6', '7'],
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'The central seven-note scale behind most major-key melodies and harmony.',
    use: 'Pop, folk, country, worship',
  },
  {
    id: 'natural-minor',
    name: 'Natural minor / Aeolian',
    genre: 'POPULAR',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
    degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: 'The natural minor palette: familiar, direct and emotionally dark.',
    use: 'Pop, soundtrack, alternative',
  },
  {
    id: 'major-pentatonic',
    name: 'Major pentatonic',
    genre: 'POPULAR',
    formula: '1 - 2 - 3 - 5 - 6',
    degrees: ['1', '2', '3', '5', '6'],
    intervals: [0, 2, 4, 7, 9],
    description: 'Five notes with strong consonance and no half-step friction.',
    use: 'Pop hooks, folk, country',
  },
  {
    id: 'minor-pentatonic',
    name: 'Minor pentatonic',
    genre: 'BLUES / ROCK',
    formula: '1 - b3 - 4 - 5 - b7',
    degrees: ['1', 'b3', '4', '5', 'b7'],
    intervals: [0, 3, 5, 7, 10],
    description: 'The essential compact vocabulary for bends, riffs and expressive phrasing.',
    use: 'Blues, rock, punk',
  },
  {
    id: 'blues',
    name: 'Blues scale',
    genre: 'BLUES / ROCK',
    formula: '1 - b3 - 4 - b5 - 5 - b7',
    degrees: ['1', 'b3', '4', 'b5', '5', 'b7'],
    intervals: [0, 3, 5, 6, 7, 10],
    description: 'Minor pentatonic with the blue note added between the fourth and fifth.',
    use: 'Blues leads, rock solos, R&B',
  },
  {
    id: 'dorian',
    name: 'Dorian',
    genre: 'JAZZ / FUNK',
    formula: '1 - 2 - b3 - 4 - 5 - 6 - b7',
    degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: 'Minor tonality with a natural sixth for a lifted, groove-forward sound.',
    use: 'Funk, jazz, modal rock',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    genre: 'JAZZ / FUNK',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
    degrees: ['1', '2', '3', '4', '5', '6', 'b7'],
    intervals: [0, 2, 4, 5, 7, 9, 10],
    description: 'Major brightness with a lowered seventh for dominant and rootsy movement.',
    use: 'Funk, blues, jam, country',
  },
  {
    id: 'melodic-minor',
    name: 'Melodic minor',
    genre: 'JAZZ / FUNK',
    formula: '1 - 2 - b3 - 4 - 5 - 6 - 7',
    degrees: ['1', '2', 'b3', '4', '5', '6', '7'],
    intervals: [0, 2, 3, 5, 7, 9, 11],
    description: 'Minor third with a major sixth and seventh for modern harmonic color.',
    use: 'Jazz, fusion, altered harmony',
  },
  {
    id: 'whole-tone',
    name: 'Whole tone',
    genre: 'JAZZ / FUNK',
    formula: '1 - 2 - 3 - #4 - b6 - b7',
    degrees: ['1', '2', '3', '#4', 'b6', 'b7'],
    intervals: [0, 2, 4, 6, 8, 10],
    description: 'A six-note symmetrical scale that erases a clear major/minor center.',
    use: 'Jazz chords, cinematic tension',
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    genre: 'METAL / FLAMENCO',
    formula: '1 - b2 - b3 - 4 - 5 - b6 - b7',
    degrees: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    intervals: [0, 1, 3, 5, 7, 8, 10],
    description: 'Minor scale with a tense flat second and an unmistakable dark contour.',
    use: 'Metal, flamenco, soundtrack',
  },
  {
    id: 'harmonic-minor',
    name: 'Harmonic minor',
    genre: 'METAL / FLAMENCO',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - 7',
    degrees: ['1', '2', 'b3', '4', '5', 'b6', '7'],
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: 'Natural minor with a raised seventh for dramatic dominant resolution.',
    use: 'Classical, metal, neoclassical',
  },
  {
    id: 'phrygian-dominant',
    name: 'Phrygian dominant',
    genre: 'METAL / FLAMENCO',
    formula: '1 - b2 - 3 - 4 - 5 - b6 - b7',
    degrees: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
    intervals: [0, 1, 4, 5, 7, 8, 10],
    description: 'The major-third Phrygian sound associated with flamenco and dramatic riffs.',
    use: 'Flamenco, metal, world fusion',
  },
  {
    id: 'diminished-half-whole',
    name: 'Diminished half-whole',
    genre: 'METAL / FLAMENCO',
    formula: '1 - b2 - b3 - 3 - #4 - 5 - 6 - b7',
    degrees: ['1', 'b2', 'b3', '3', '#4', '5', '6', 'b7'],
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    description: 'An eight-note symmetrical palette for dominant tension and angular lines.',
    use: 'Jazz, metal, fusion',
  },
  {
    id: 'hirajoshi',
    name: 'Hirajoshi',
    genre: 'WORLD',
    formula: '1 - 2 - b3 - 5 - b6',
    degrees: ['1', '2', 'b3', '5', 'b6'],
    intervals: [0, 2, 3, 7, 8],
    description: 'A spacious five-note Japanese scale with a distinct minor contour.',
    use: 'Ambient, world, cinematic',
  },
  {
    id: 'double-harmonic',
    name: 'Double harmonic',
    genre: 'WORLD',
    formula: '1 - b2 - 3 - 4 - 5 - b6 - 7',
    degrees: ['1', 'b2', '3', '4', '5', 'b6', '7'],
    intervals: [0, 1, 4, 5, 7, 8, 11],
    description: 'Two augmented seconds create a vivid, ornate melodic identity.',
    use: 'World, film, experimental',
  },
];

export function scaleNotes(rootIndex: number, intervals: number[]): string[] {
  return intervals.map((interval) => SCALE_ROOTS[(rootIndex + interval) % SCALE_ROOTS.length]);
}
