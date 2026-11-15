# Design: TabTensor

TabTensor is a local-first guitar utility: tune an instrument, open a Guitar Pro, MusicXML or MIDI file, and practise against read-only notation with local playback.

It shares one design system with FullScanSecurity, so the two apps read as one suite. They differ only in content and in the accent: red here, green in FullScanSecurity. Both accents come from the app icons.

## Suite tokens

The runtime values live in `src/theme.ts`. FullScanSecurity mirrors them in `app/src/main/res/values/colors.xml` and `styles.xml`. `tokens.css` is the same set as CSS variables.

| Token | Value | Use |
|---|---|---|
| ground | `#0E0F13` | window, tab bar, splash, icon tile |
| surface | `#16171C` | cards, sheets, lists |
| raised | `#1E2026` | nested panels, tracks |
| active | `#262830` | selected or pressed fill |
| rule | `#23252C` | 1px rules between rows |
| control | `#3A3D47` | outlined buttons and inputs |
| ink | `#F4F5F7` | primary text |
| muted | `#B4B7BF` | secondary text |
| faint | `#8E929B` | meta text |
| accent | `#FA2A25` | primary action, live data (playhead, active note), selection |
| accentTint | `#2B1311` | error notice, selected row |
| positive | `#3FC07A` | in tune |

The dark theme is the only theme.

## Type

Instrument Sans (SIL OFL, `assets/fonts/`) in 400, 500 and 600, embedded by the `expo-font` config plugin. The system monospace is used only for real data: file formats, formulas and frequencies.

| Style | Size / weight |
|---|---|
| display | 32 / 600, tracking −0.6 |
| title | 24 / 600, used for screen titles |
| section | 17 / 600 |
| body | 16 / 400, line height 24 |
| caption | 14 / 400, muted |
| meta | 12 / 500, faint |
| readout | 52 / 600, for live figures such as the tuner note |

Text is in sentence case. The UI has no tracked uppercase labels, eyebrows or decorative numbering.

## Shape and depth

- Cards use a 16 radius. Buttons and inputs use 12. Chips are pills.
- Surfaces separate by a tone step from the ground, never by a shadow. Rules are 1px `rule`.
- There are no gradients, glass, glows or decorative dots.

## Components

- **Header (`AppHeader`)**: the 22px app mark, "TabTensor" in section style, and "On device" in meta. FullScanSecurity uses the same header.
- **Buttons (`ActionButton`)**: primary is filled accent with ground-coloured text. Secondary is outlined in `control`. Quiet is text only.
- **Tab bar**: labels in faint; the active label turns ink with a 2px accent underline.
- **Lists (`RecentFiles`)**: rows on a surface card, divided by rules, with one trailing action.

## Motion

Every control gives press feedback on touch-down (`pressed` in `src/theme.ts`: opacity 0.8, scale 0.98). Modals use the native fade. Nothing animates on entrance.

## Brand assets

`assets/brand/tabtensor-mark.svg` is the master mark. `icon.png`, `adaptive-icon*.png`, `splash-icon.png`, `favicon.png` and `brand/mark.png` are rendered from it.
