import { RecentFile } from '@/types';
import { readJson, writeJson } from './localStorage';

const MAX_RECENT_FILES = 12;

export async function loadRecentFiles(): Promise<RecentFile[]> {
  return readJson<RecentFile[]>('recent-files', []);
}

export async function rememberFile(file: RecentFile): Promise<RecentFile[]> {
  const existing = await loadRecentFiles();
  const next = [file, ...existing.filter((item) => item.id !== file.id)].slice(0, MAX_RECENT_FILES);
  await writeJson('recent-files', next);
  return next;
}

export async function forgetFile(id: string): Promise<RecentFile[]> {
  const existing = await loadRecentFiles();
  const next = existing.filter((item) => item.id !== id);
  await writeJson('recent-files', next);
  return next;
}
