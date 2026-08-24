import { RecentFile } from '@/types';
import { readJson, writeJson } from './localStorage';
import { sanitizeRecentFiles } from './sanitizers';

const MAX_RECENT_FILES = 12;

export async function loadRecentFiles(): Promise<RecentFile[]> {
  return sanitizeRecentFiles(await readJson<unknown>('recent-files', []), MAX_RECENT_FILES);
}

export async function rememberFile(file: RecentFile): Promise<RecentFile[]> {
  const existing = await loadRecentFiles();
  const safeFile = sanitizeRecentFiles([file], 1)[0];
  if (!safeFile) return existing;
  const next = [safeFile, ...existing.filter((item) => item.id !== safeFile.id)].slice(0, MAX_RECENT_FILES);
  await writeJson('recent-files', next);
  return next;
}

export async function forgetFile(id: string): Promise<RecentFile[]> {
  const existing = await loadRecentFiles();
  const next = existing.filter((item) => item.id !== id);
  await writeJson('recent-files', next);
  return next;
}
