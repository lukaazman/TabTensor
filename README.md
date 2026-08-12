# TabTensor

Cross-platform guitar utility app for Android and iOS, built with Expo, React Native and TypeScript.

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
