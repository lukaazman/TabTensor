import { PlayerFormat } from '@/types';

export const GUITAR_PRO_EXTENSIONS = ['gp', 'gp3', 'gp4', 'gp5', 'gpx', 'gp7', 'gp8'] as const;
export const MUSIC_XML_EXTENSIONS = ['musicxml', 'xml'] as const;
export const MIDI_EXTENSIONS = ['mid', 'midi'] as const;

export type SupportedExtension =
  | (typeof GUITAR_PRO_EXTENSIONS)[number]
  | (typeof MUSIC_XML_EXTENSIONS)[number]
  | (typeof MIDI_EXTENSIONS)[number];

export function getExtension(name: string): string {
  const cleanName = name.split(/[?#]/)[0];
  return cleanName.split('.').pop()?.toLowerCase() ?? '';
}

export function formatForExtension(extension: string): PlayerFormat | null {
  if (GUITAR_PRO_EXTENSIONS.includes(extension as (typeof GUITAR_PRO_EXTENSIONS)[number])) return 'guitar-pro';
  if (MUSIC_XML_EXTENSIONS.includes(extension as (typeof MUSIC_XML_EXTENSIONS)[number])) return 'musicxml';
  if (MIDI_EXTENSIONS.includes(extension as (typeof MIDI_EXTENSIONS)[number])) return 'midi';
  return null;
}

export function formatForFile(name: string): PlayerFormat | null {
  return formatForExtension(getExtension(name));
}

export function isSupportedPlayerFile(name: string): boolean {
  return formatForFile(name) !== null;
}

export function isSupportedGuitarProFile(name: string): boolean {
  return formatForFile(name) === 'guitar-pro';
}

export function formatLabelForFile(name: string): string {
  const extension = getExtension(name);
  const format = formatForExtension(extension);
  if (format === 'musicxml') return 'MUSICXML';
  if (format === 'midi') return 'MIDI';
  return extension.toUpperCase();
}

export function supportedFileError(): string {
  return 'Unsupported file. Choose a Guitar Pro, MusicXML or MIDI file.';
}
