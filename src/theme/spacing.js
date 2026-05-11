// 4 / 8 / 12 / 16 / 24 / 32 / 48 grid — never use raw pixel values
// in screens. Always reference these tokens.

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  mdLg: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const radius = {
  sm: 8,    // chips
  md: 12,   // buttons
  lg: 16,   // cards / tiles
  xl: 20,
  xxl: 24,  // bottom sheets
  card: 22,
  pill: 999,
};

import { Platform } from 'react-native';
import colors from './colors';

const elevation = (level, color = '#000') => Platform.select({
  ios: {
    shadowColor: color,
    shadowOffset: { width: 0, height: level },
    shadowOpacity: 0.18 + level * 0.02,
    shadowRadius: level * 2,
  },
  android: {
    elevation: level * 2,
  },
});

export const shadows = {
  none: {},
  sm: elevation(2),
  md: elevation(4),
  lg: elevation(8),
  xl: elevation(12),
  glowPrimary: elevation(8, colors.primary),
  glowAccent: elevation(8, colors.accent),
  glowSuccess: elevation(6, colors.success),
};

export default spacing;
