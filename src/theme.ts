import { Platform, StyleSheet } from 'react-native';

export const colors = {
  black: '#080808',
  panel: '#111111',
  panelRaised: '#171717',
  panelSoft: '#202020',
  border: '#303030',
  borderStrong: '#484848',
  white: '#F5F4F0',
  textMuted: '#9A9993',
  textDim: '#66655F',
  red: '#E83333',
  redBright: '#FF4B4B',
  redDim: '#641D1D',
  green: '#B6D796',
  amber: '#F1B86A',
};

export const layout = {
  screenPadding: 18,
  radius: 4,
  controlHeight: 46,
  tabBarHeight: 72,
};

export const type = StyleSheet.create({
  display: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  screenTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  section: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  body: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  mono: {
    color: colors.white,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
