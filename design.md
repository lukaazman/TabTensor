# Design — TabTensor Forge

A locked design system for the TabTensor React Native app. The app is a local-first guitar utility: tune an instrument, import a Guitar Pro, MusicXML or MIDI file, and work through read-only notation with local playback.

## Genre

modern-minimal

## Macrostructure family

The app uses the Workbench shape: one dominant working surface, followed by a compact control ledger. Screens keep their existing functional ownership and differ through their primary surface.

- Marketing pages: not applicable
- App pages: Workbench — primary surface + control ledger
- Content pages: not applicable

## Theme

TabTensor Forge is a dark, warm graphite instrument-panel system with one red signal accent. The accent marks active state, primary action, focus, and the live playhead; it is not used as a decorative field.

- `--color-paper`   `oklch(15% 0.009 28)`
- `--color-paper-2` `oklch(19% 0.011 28)`
- `--color-paper-3` `oklch(24% 0.012 28)`
- `--color-ink`     `oklch(96% 0.006 70)`
- `--color-ink-2`   `oklch(77% 0.014 55)`
- `--color-rule`   `oklch(29% 0.012 28)`
- `--color-rule-2` `oklch(39% 0.015 28)`
- `--color-muted`  `oklch(62% 0.012 45)`
- `--color-accent` `oklch(61% 0.18 28)`
- `--color-accent-bright` `oklch(68% 0.19 28)`
- `--color-accent-wash` `oklch(26% 0.07 28)`
- `--color-accent-ink` `oklch(14% 0.01 28)`
- `--color-focus`  `oklch(75% 0.20 28)`
- `--color-success` `oklch(73% 0.13 145)`
- `--color-warning` `oklch(77% 0.13 75)`

## Typography

The runtime uses the platform sans family for display and body roles, with a platform monospace for measurements, file formats, note values, and timing. Hierarchy comes from scale, weight, and tracking rather than a decorative font.

- Display: platform sans, weight 800, style normal
- Body: platform sans, weight 400–600
- Mono: platform monospace, weight 500–700
- Display tracking: tight for readouts, open for labels
- Type scale anchor: display readout is 78px on the tuner surface; screen titles are 32px.

## Spacing

4-point named scale. Values live in `tokens.css` and are mirrored by `src/theme.ts`. Components use semantic runtime tokens instead of isolated colour or spacing literals.

## Motion

- Button press: scale/opacity feedback, 100–150ms
- Modal: native fade, 250–300ms
- Reveal pattern: none; the app should feel ready immediately
- Reduced-motion fallback: native state changes remain functional; no decorative motion is added

## Microinteractions stance

- Silent success for tuning, file selection, and playback controls
- Inline loading replaces the action label
- Error surfaces explain what broke and what the user can do
- Touch targets are at least 44×44dp
- Pressed state is tactile; no bouncy or perpetual motion

## CTA voice

- Primary action: compact filled signal-red control, single-line label
- Secondary action: graphite surface with a visible rule
- Quiet action: transparent surface with an understated rule and explicit verb

## Information hierarchy

- Screen and section names are words, not ordinal labels.
- Decorative numbers such as `01 / TUNER`, `02 / PLAYER`, or `01 / 03` are not part of the UI.
- Keep numbers only when they change the user's decision: pitch, tempo, time, measure, fret/string position, file counts, or chord-voicing position.
- Details belong behind the section they describe; the first view should show the next useful action.

## Per-page allowances

- App pages must not use decorative enrichment. Function and data carry the page.
- Tuner: dominant live readout and string-selection grid.
- Player: import action and local file ledger for Guitar Pro, MusicXML and MIDI.
- Playback: transport first, score second, mixer last.

## What pages MUST share

- TABTENSOR wordmark treatment and warm graphite paper
- Red signal accent and semantic success/warning states
- Platform sans + mono pairing
- 4-point spacing scale
- Compact bottom mode dock for tuner/player navigation
- Control height, focus contrast, and pressed-state behavior

## What pages MAY differ on

- Primary surface geometry: gauge, file ledger, or score viewport
- Secondary control density
- Context label and local status copy

## Exports

The portable CSS token export is in `tokens.css`. The React Native runtime mapping is in `src/theme.ts` because RN does not consume web CSS.
