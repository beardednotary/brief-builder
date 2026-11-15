import { ViewStyle } from 'react-native';

export const Colors = {
  primary: '#011D58',
  primaryLight: '#1450C8',
  accent: '#FDBB17',
  // Text and icons placed on top of an accent-coloured fill.
  onAccent: '#011D58',
  // Gold dark enough to read as text on white or light surfaces.
  accentText: '#8A5F00',
  background: '#F0F2F7',
  surface: '#FFFFFF',
  border: '#DDE2EE',
  divider: '#EEF0F5',
  text: '#0F172A',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  success: '#15803D',
  warning: '#B45309',
  error: '#B91C1C',
  // MPA accent colors
  mpaBlue: '#011D58',
  mpaGreen: '#15803D',
  mpaAmber: '#B07D0C',
  mpaPurple: '#6B21A8',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  full: 999,
} as const;

export const Shadow: { card: ViewStyle; lifted: ViewStyle } = {
  card: {
    shadowColor: '#011D58',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  lifted: {
    shadowColor: '#011D58',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 8,
  },
};
