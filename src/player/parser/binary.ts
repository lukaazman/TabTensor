import * as FileSystem from 'expo-file-system/legacy';

export async function readFileBytes(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return base64ToBytes(base64);
}

export function base64ToBytes(value: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, '');
  const output = new Uint8Array(Math.floor((clean.length * 3) / 4) - (clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0));
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (const character of clean) {
    if (character === '=') break;
    buffer = (buffer << 6) | alphabet.indexOf(character);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[offset] = (buffer >> bits) & 0xff;
      offset += 1;
    }
  }
  return output;
}

export function utf8FromBytes(bytes: Uint8Array): string {
  const decoder = (globalThis as unknown as { TextDecoder?: new (label?: string) => { decode(input: Uint8Array): string } }).TextDecoder;
  if (decoder) return new decoder('utf-8').decode(bytes).replace(/^\uFEFF/, '');

  let result = '';
  for (let index = 0; index < bytes.length;) {
    const first = bytes[index++];
    if (first < 0x80) {
      result += String.fromCharCode(first);
    } else if (first < 0xe0 && index < bytes.length) {
      result += String.fromCharCode(((first & 0x1f) << 6) | (bytes[index++] & 0x3f));
    } else if (first < 0xf0 && index + 1 < bytes.length) {
      const code = ((first & 0x0f) << 12) | ((bytes[index++] & 0x3f) << 6) | (bytes[index++] & 0x3f);
      result += String.fromCharCode(code);
    } else if (index + 2 < bytes.length) {
      const codePoint = ((first & 0x07) << 18) | ((bytes[index++] & 0x3f) << 12) | ((bytes[index++] & 0x3f) << 6) | (bytes[index++] & 0x3f);
      result += String.fromCodePoint(codePoint);
    }
  }
  return result.replace(/^\uFEFF/, '');
}

export function asciiFromBytes(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes);
}
