import { PitchEngine, PitchEngineCallbacks } from './PitchEngine';
import { detectFundamental } from '../pitch';
import { hasNativeAudioApi } from './NativeAudioAvailability';

declare const require: (moduleName: string) => unknown;

type NativeAudioApi = typeof import('react-native-audio-api');

export class NativePitchEngine implements PitchEngine {
  private audioApi: NativeAudioApi | null = null;
  private recorder: InstanceType<NativeAudioApi['AudioRecorder']> | null = null;
  private callbacks: PitchEngineCallbacks | null = null;
  private running = false;

  isAvailable(): boolean {
    if (!hasNativeAudioApi()) return false;
    if (this.audioApi) return true;
    try {
      this.audioApi = require('react-native-audio-api') as NativeAudioApi;
      return Boolean(this.audioApi?.AudioRecorder && this.audioApi?.AudioManager);
    } catch {
      return false;
    }
  }

  async start(callbacks: PitchEngineCallbacks): Promise<void> {
    if (!this.isAvailable() || !this.audioApi) {
      throw new Error('Microphone audio module is unavailable. Build TabTensor with the native development client.');
    }
    this.callbacks = callbacks;
    const permission = await this.audioApi.AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') {
      throw new Error('Microphone permission was denied. Enable microphone access in system settings to use the tuner.');
    }

    this.audioApi.AudioManager.setAudioSessionOptions({
      iosCategory: 'record',
      iosMode: 'measurement',
      iosOptions: [],
    });

    if (!this.recorder) this.recorder = new this.audioApi.AudioRecorder();
    const callbackResult = this.recorder.onAudioReady(
      {
        sampleRate: 44100,
        bufferLength: 4096,
        channelCount: 1,
      },
      ({ buffer, numFrames }) => {
        if (!this.running || !this.callbacks) return;
        const channel = buffer.getChannelData(0);
        const samples = channel.length === numFrames ? channel : channel.slice(0, numFrames);
        const detected = detectFundamental(samples, 44100);
        if (!detected) return;
        this.callbacks.onReading({
          frequency: detected.frequency,
          level: detected.level,
          confidence: detected.confidence,
        });
      },
    );
    if (callbackResult.status === 'error') {
      throw new Error(`Unable to initialize microphone audio: ${callbackResult.message}`);
    }

    const startResult = await this.recorder.start();
    if (startResult.status === 'error') {
      this.recorder.clearOnAudioReady();
      throw new Error(`Unable to start microphone audio: ${startResult.message}`);
    }
    this.running = true;
  }

  async stop(): Promise<void> {
    this.running = false;
    this.callbacks = null;
    if (!this.recorder) return;
    this.recorder.clearOnAudioReady();
    if (this.recorder.isRecording()) await this.recorder.stop();
  }
}

export function createPitchEngine(): PitchEngine {
  return new NativePitchEngine();
}
