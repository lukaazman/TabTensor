import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';
import { NativeModules, TurboModuleRegistry } from 'react-native';

type RuntimeGlobals = typeof globalThis & {
  expo?: { modules?: Record<string, unknown> };
};

function isExpoGoRuntime(): boolean {
  const expoGoModule = requireOptionalNativeModule('ExpoGo');
  const expoConstants = (NativeModules as typeof NativeModules & {
    ExponentConstants?: { appOwnership?: string; executionEnvironment?: string };
  }).ExponentConstants;
  const expoGlobal = (globalThis as RuntimeGlobals).expo;

  return Boolean(
    isRunningInExpoGo()
      || expoGoModule
      || expoGlobal?.modules?.ExpoGo
      || NativeModules?.ExpoGo
      || expoConstants?.appOwnership === 'expo'
      || expoConstants?.executionEnvironment === 'storeClient',
  );
}

export function hasNativeAudioApi(): boolean {
  if (isExpoGoRuntime()) return false;
  try {
    return Boolean(TurboModuleRegistry.get('AudioAPIModule'));
  } catch {
    return false;
  }
}
