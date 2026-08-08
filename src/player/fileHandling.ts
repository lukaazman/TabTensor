import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { RecentFile } from '@/types';
import { getExtension, isSupportedGuitarProFile } from './parser/GuitarProParser';

const PICKER_TYPES = [
  'application/octet-stream',
  'application/x-guitar-pro',
  'application/x-gp',
  '*/*',
];

export async function pickGuitarProFile(): Promise<RecentFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: PICKER_TYPES,
    // Keep the provider URI so FileSystem.copyAsync can import it into the
    // app-owned directory below. Expo Go can otherwise return a temporary
    // host cache URI that is outside the current experience sandbox.
    copyToCacheDirectory: false,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (!isSupportedGuitarProFile(asset.name)) {
    throw new Error('Unsupported file. Select a Guitar Pro file ending in .gp, .gp3, .gp4, .gp5, .gpx, .gp7 or .gp8.');
  }

  const directoryRoot = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!directoryRoot) throw new Error('Device storage is unavailable. Try again after restarting the app.');
  const directory = `${directoryRoot}tabtensor-songs/`;
  const destination = `${directory}${Date.now()}-${sanitizeFileName(asset.name)}`;
  try {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    await FileSystem.copyAsync({ from: asset.uri, to: destination });
  } catch (reason: unknown) {
    const detail = reason instanceof Error ? reason.message : 'The selected file could not be copied.';
    throw new Error(`Could not import this Guitar Pro file into TabTensor storage: ${detail}`);
  }

  const importedInfo = await FileSystem.getInfoAsync(destination);
  if (!importedInfo.exists) throw new Error('The selected Guitar Pro file was not copied into TabTensor storage.');

  return {
    id: `${destination}:${asset.name}`,
    name: asset.name,
    uri: destination,
    format: getExtension(asset.name).toUpperCase(),
    openedAt: Date.now(),
  };
}

export async function isFileAccessible(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
