import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { RecentFile } from '@/types';
import { formatLabelForFile, isSupportedPlayerFile, supportedFileError } from './parser/FileFormats';

const PICKER_TYPES = [
  'application/octet-stream',
  'application/x-guitar-pro',
  'application/x-gp',
  'application/vnd.recordare.musicxml+xml',
  'application/xml',
  'text/xml',
  'audio/midi',
  'audio/x-midi',
  '*/*',
];
const IMPORT_DIRECTORY = 'tabtensor-songs/';
const GENERATED_IMPORT_NAME = /^\d+-[a-zA-Z0-9._-]+$/;
const operationOwnedDestinations = new Set<string>();

export async function pickPlayerFile(): Promise<RecentFile | null> {
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
  if (!isSupportedPlayerFile(asset.name)) throw new Error(supportedFileError());

  const directoryRoot = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!directoryRoot) throw new Error('Device storage is unavailable. Try again after restarting the app.');
  const directory = directoryRoot + IMPORT_DIRECTORY;
  const destination = directory + Date.now() + '-' + sanitizeFileName(asset.name);
  let destinationWasAvailable = false;

  try {
    const existingInfo = await FileSystem.getInfoAsync(destination);
    if (existingInfo.exists) throw new Error('Could not allocate a unique destination for this file.');
    destinationWasAvailable = true;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    await FileSystem.copyAsync({ from: asset.uri, to: destination });
    const importedInfo = await FileSystem.getInfoAsync(destination);
    if (!importedInfo.exists) throw new Error('The selected file was not copied into TabTensor storage.');
    operationOwnedDestinations.add(destination);
  } catch (reason: unknown) {
    if (destinationWasAvailable) {
      await deleteImportDestination(destination);
    }
    const detail = reason instanceof Error ? reason.message : 'The selected file could not be copied.';
    throw new Error('Could not import this file into TabTensor storage: ' + detail);
  }

  return {
    id: destination + ':' + asset.name,
    name: asset.name,
    uri: destination,
    format: formatLabelForFile(asset.name),
    openedAt: Date.now(),
  };
}

// Backwards-compatible export for callers from the Guitar Pro-only MVP.
export const pickGuitarProFile = pickPlayerFile;

export async function cleanupImportedPlayerFile(uri: string): Promise<void> {
  if (!operationOwnedDestinations.has(uri)) return;
  if (!isGeneratedImportDestination(uri)) return;
  operationOwnedDestinations.delete(uri);
  await deleteImportDestination(uri);
}

export function releaseImportedPlayerFile(uri: string): void {
  if (!operationOwnedDestinations.has(uri)) return;
  if (!isGeneratedImportDestination(uri)) return;
  operationOwnedDestinations.delete(uri);
}

export async function isFileAccessible(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

function getAppOwnedImportDirectories(): string[] {
  return [FileSystem.documentDirectory, FileSystem.cacheDirectory]
    .filter((root): root is string => Boolean(root))
    .map((root) => root + IMPORT_DIRECTORY);
}

function isGeneratedImportDestination(uri: string): boolean {
  return getAppOwnedImportDirectories().some((directory) => {
    if (!uri.startsWith(directory)) return false;
    return GENERATED_IMPORT_NAME.test(uri.slice(directory.length));
  });
}

async function deleteImportDestination(uri: string): Promise<void> {
  if (!isGeneratedImportDestination(uri)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Cleanup is best-effort; the caller must retain the original import error.
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
