export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function formatOpenedAt(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
