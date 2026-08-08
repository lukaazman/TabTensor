import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@tabtensor/';

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(`${PREFIX}${key}`);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Preferences are best-effort and the app can continue without them.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // Ignore storage failures.
  }
}
