import { StyleSheet } from 'react-native';

// Suite tokens, shared with FullScanSecurity (app/src/main/res/values/colors.xml).
// Only accent, accentDeep and accentTint differ per app.
export const colors = {
  ground: '#0E0F13',
  surface: '#16171C',
  raised: '#1E2026',
  active: '#262830',
  rule: '#23252C',
  control: '#3A3D47',
  ink: '#F4F5F7',
  muted: '#B4B7BF',
  faint: '#8E929B',
  accent: '#FA2A25',
  accentDeep: '#C81E1A',
  accentTint: '#2B1311',
  onAccent: '#0E0F13',
  positive: '#3FC07A',
  scrim: 'rgba(14, 15, 19, 0.82)',
};

// Instrument Sans is embedded by the expo-font config plugin (app.json); the names are the PostScript names.
export const font = {
  regular: 'InstrumentSans-Regular',
  medium: 'InstrumentSans-Medium',
  semibold: 'InstrumentSans-SemiBold',
  mono: 'monospace',
};

export const size = {
  meta: 12,
  caption: 14,
  body: 16,
  section: 17,
  title: 24,
  display: 32,
  readout: 52,
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 };

export const radius = { bar: 2, control: 12, card: 16, pill: 999 };

export const layout = {
  screenPadding: 20,
  screenTopPadding: 4,
  controlHeight: 48,
  tabBarHeight: 64,
};

export const type = StyleSheet.create({
  display: {
    color: colors.ink,
    fontFamily: font.semibold,
    fontSize: size.display,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  title: { color: colors.ink, fontFamily: font.semibold, fontSize: size.title, lineHeight: 30, letterSpacing: -0.24 },
  section: { color: colors.ink, fontFamily: font.semibold, fontSize: size.section, lineHeight: 22 },
  body: { color: colors.ink, fontFamily: font.regular, fontSize: size.body, lineHeight: 24 },
  caption: { color: colors.muted, fontFamily: font.regular, fontSize: size.caption, lineHeight: 20 },
  meta: { color: colors.faint, fontFamily: font.medium, fontSize: size.meta, lineHeight: 16 },
  label: { color: colors.ink, fontFamily: font.semibold, fontSize: size.body, lineHeight: 22 },
  mono: { color: colors.muted, fontFamily: font.mono, fontSize: 13, lineHeight: 18 },
  readout: { color: colors.ink, fontFamily: font.semibold, fontSize: size.readout, lineHeight: 58, letterSpacing: -1 },
});

// Press feedback on touch-down, the same in every control.
export const pressed = { opacity: 0.8, transform: [{ scale: 0.98 }] };
