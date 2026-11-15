# TabTensor

Cross-platform guitar utility app for Android and iOS, built with Expo, React Native and TypeScript.

## Download

[![Download Android](https://img.shields.io/badge/Android-v0.1.0-FA2A25?logo=android&logoColor=white)](https://github.com/lukaazman/TabTensor/releases/download/v0.1.0/TabTensor.apk)
[![Download iOS](https://img.shields.io/badge/iOS-v0.1.0-FA2A25?logo=apple&logoColor=white)](https://github.com/lukaazman/TabTensor/releases/download/v0.1.0/TabTensor.ipa)

- **Android:** open `TabTensor.apk` and allow installs from unknown apps if asked.
- **iOS:** `TabTensor.ipa` is unsigned. Install it with AltStore or Sideloadly.

The MVP contains:

- a local microphone tuner with automatic/manual string targeting, calibration, preset tunings and saved custom tuning;
- a local song-file picker for Guitar Pro, MusicXML and MIDI with recent files, read-only notation, format-aware playback, seek, practice speed, count-in, loop A/B and per-track/master mixing;
- Guitar Pro keeps its existing tablature/technique workflow, while MusicXML adds staff notation, dynamics and lyrics where present, and MIDI keeps tempo maps, instrument programs, velocity and percussion tracks.

## Run locally

```bash
npm install
npm run typecheck
npx expo prebuild
npm run android
# or
npm run ios
```
