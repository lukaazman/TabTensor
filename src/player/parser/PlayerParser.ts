import { GuitarProSong } from '@/types';
import { formatForFile, getExtension, isSupportedPlayerFile } from './FileFormats';
import { parseGuitarProFile } from './GuitarProParser';
import { parseMidiFile } from './MidiParser';
import { parseMusicXmlFile } from './MusicXmlParser';

export { formatForFile, getExtension, isSupportedPlayerFile } from './FileFormats';

export async function parsePlayerFile(uri: string, sourceName: string): Promise<GuitarProSong> {
  const format = formatForFile(sourceName);
  if (format === 'guitar-pro') return parseGuitarProFile(uri, sourceName);
  if (format === 'musicxml') return parseMusicXmlFile(uri, sourceName);
  if (format === 'midi') return parseMidiFile(uri, sourceName);
  throw new Error('Unsupported file. Choose a Guitar Pro, MusicXML or MIDI file.');
}
