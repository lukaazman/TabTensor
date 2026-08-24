const NATIVE_PLAYBACK_ERROR = 'Native audio playback is unavailable. Build TabTensor with the native development client.';
const MICROPHONE_ERROR = 'Microphone audio is unavailable. Build TabTensor with the native development client.';
const PERMISSION_ERROR = 'Microphone permission is required for Follow Tab. Open microphone settings and try again.';
const MISSING_FILE_ERROR = 'This file is no longer available. Remove it and open the source file again.';

const KNOWN_PARSER_PREFIXES = [
  'the file does not contain a valid midi header.',
  'this midi format is not supported.',
  'smpte-timed midi files are not supported;',
  'the midi file contains no playable notes.',
  'this musicxml file is not a score-partwise document.',
  'no parts detected in this musicxml file.',
  'the musicxml file contains no playable pitched notes.',
  'no tracks detected in this guitar pro file.',
  'the file contains no playable notes.',
];

const TECHNICAL_DETAIL_PATTERN = /\b(?:TypeError|ReferenceError|SyntaxError|RangeError|Invariant Violation|NativeModules|AudioContext|react-native|expo-|Hermes|JSI|stack trace|ENOENT|EACCES|failed to parse|invalid running status|invalid variable-length|unexpected end|malformed)\b|\s+at\s+/i;

export function toUserFacingPlayerError(reason: unknown, fallback: string): string {
  const rawMessage = reason instanceof Error
    ? reason.message
    : typeof reason === 'string'
      ? reason
      : '';
  if (!rawMessage.trim()) return fallback;

  const line = firstMeaningfulLine(rawMessage);
  if (!line) return fallback;
  const safeLine = redactLocalPaths(line);
  const lower = line.toLowerCase();

  if (lower.includes('native audio playback is unavailable')) return NATIVE_PLAYBACK_ERROR;
  if (lower.includes('microphone audio is unavailable')) return MICROPHONE_ERROR;
  const microphonePermission = lower.includes('microphone')
    && (lower.includes('permission') || lower.includes('denied') || lower.includes('not authorized'));
  if (microphonePermission) return PERMISSION_ERROR;
  if (lower.includes('permission denied') || lower.includes('access denied') || lower.includes('not authorized')) return fallback;
  if (lower.includes('file is no longer available') || lower.includes('open the source file again')) return MISSING_FILE_ERROR;
  if (lower.startsWith('unsupported file')) return safeLine;
  if (lower.includes('device storage is unavailable')) return 'Device storage is unavailable. Try again after restarting the app.';
  if (lower.includes('could not import this file') || lower.includes('selected file could not be copied') || lower.includes('selected file was not copied')) {
    return 'Could not import this file into TabTensor storage. Try selecting the file again.';
  }
  if (lower.includes('selected track contains no playable notes for follow tab')) return 'The selected track contains no playable notes for Follow Tab.';

  const parseMatch = line.match(/^Failed to parse (Guitar Pro|MusicXML|MIDI) file\b/i);
  if (parseMatch) {
    return 'Could not read this ' + parseMatch[1] + ' file. Check that it is a valid ' + parseMatch[1] + ' export and try again.';
  }
  if (KNOWN_PARSER_PREFIXES.some((prefix) => lower.startsWith(prefix))) return safeLine;

  if (TECHNICAL_DETAIL_PATTERN.test(rawMessage) || /\n\s*at\s+/i.test(rawMessage) || safeLine.length > 180) return fallback;
  return safeLine || fallback;
}

function firstMeaningfulLine(message: string): string {
  const line = message
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find((part) => part && !/^at\s+/i.test(part))
    ?? '';
  return line
    .replace(/^(?:Error|TypeError|ReferenceError|SyntaxError|RangeError):\s*/i, '')
    .replace(/\s+at\s+(?:[A-Za-z_$<])/i, '')
    .trim();
}

function redactLocalPaths(message: string): string {
  return message
    .replace(/file:\/\/?[^"')\r\n]+/gi, '[local file]')
    .replace(/[A-Za-z]:[\\/][^"')\r\n]+/g, '[local file]')
    .replace(/(?:\/Users\/|\/home\/|\/private\/|\/var\/mobile\/|\/data\/|\/storage\/|\/sdcard\/)[^"')\r\n]+/gi, '[local file]');
}
