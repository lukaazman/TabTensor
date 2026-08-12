/* Hallmark · genre: modern-minimal · tone: technical · anchor hue: warm red · macrostructure: Workbench · theme: TabTensor Forge */
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R4 V4 */
import { Platform, StyleSheet } from 'react-native';

const fontFamilies = {
  display: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'sans-serif' }) ?? 'sans-serif',
  body: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'sans-serif' }) ?? 'sans-serif',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) ?? 'monospace',
};

export const colors = {
  paper: '#191615',
  paperRaised: '#25211F',
  paperSoft: '#302A27',
  ink: '#F2EDE7',
  inkMuted: '#C8BEB6',
  rule: '#4B413D',
  ruleStrong: '#655A54',
  muted: '#9E9188',
  neutral: '#81756E',
  accent: '#E34E3F',
  accentBright: '#FF6555',
  accentWash: '#4A2925',
  accentInk: '#1D1412',
  focus: '#FF8070',
  success: '#B5D598',
  warning: '#E8B06A',
  instrumentWood: '#6B382C',
  instrumentWoodLight: '#714137',
  instrumentWoodMid: '#65352E',
  instrumentWoodDeep: '#4C2B28',
  scrim: 'rgba(5, 4, 4, 0.82)',

  // Compatibility aliases keep the logic-facing components readable while
  // all values still resolve to the semantic Forge palette above.
  black: '#191615',
  panel: '#25211F',
  panelRaised: '#302A27',
  panelSoft: '#3A322E',
  border: '#4B413D',
  borderStrong: '#655A54',
  white: '#F2EDE7',
  textMuted: '#9E9188',
  textDim: '#81756E',
  red: '#E34E3F',
  redBright: '#FF6555',
  redDim: '#4A2925',
  green: '#B5D598',
  amber: '#E8B06A',
};

export const layout = {
  screenPadding: 20,
  screenTopPadding: 12,
  sectionGap: 24,
  panelGap: 12,
  radiusCard: 16,
  radiusControl: 10,
  radiusPill: 999,
  controlHeight: 48,
  compactControlHeight: 44,
  tabBarHeight: 84,
};

export const type = StyleSheet.create({
  display: {
    color: colors.ink,
    fontFamily: fontFamilies.display,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  screenTitle: {
    color: colors.ink,
    fontFamily: fontFamilies.display,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  section: {
    color: colors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  body: {
    color: colors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 23,
  },
  caption: {
    color: colors.muted,
    fontFamily: fontFamilies.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  mono: {
    color: colors.ink,
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
