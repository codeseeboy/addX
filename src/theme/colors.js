import { Appearance } from 'react-native';

const dark = {
  primary: '#FF6138',
  primaryDark: '#E84A1A',
  primarySoft: 'rgba(255,97,56,0.16)',
  secondary: '#0E1224',
  surface: '#161C32',
  surfaceElevated: '#1B2440',
  surfaceHover: '#263258',
  accent: '#F5C14E',
  accentSoft: 'rgba(245,193,78,0.16)',
  success: '#35D07F',
  successSoft: 'rgba(53,208,127,0.2)',
  warning: '#F8B34B',
  danger: '#EF5D5D',
  dangerSoft: 'rgba(239,93,93,0.2)',
  textPrimary: '#F8FAFF',
  textSecondary: '#BAC3D9',
  textTertiary: '#8893AE',
  textInverse: '#11162B',
  divider: 'rgba(255,255,255,0.09)',
  dividerStrong: 'rgba(255,255,255,0.16)',
  border: 'rgba(255,255,255,0.12)',
  overlay: 'rgba(7,10,22,0.72)',
  scrim: 'rgba(0,0,0,0.42)',
  gradientHero: ['#FF6138', '#FF9263'],
  gradientNight: ['#121833', '#0A1022'],
  gradientGold: ['#F5C14E', '#FFB356'],
  gradientPlay: ['#FF6138', '#F5C14E'],
};

const light = {
  primary: '#FF6138',
  primaryDark: '#E84A1A',
  primarySoft: 'rgba(255,97,56,0.14)',
  secondary: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#EEF2FB',
  accent: '#E39C17',
  accentSoft: 'rgba(227,156,23,0.18)',
  success: '#1FB86A',
  successSoft: 'rgba(31,184,106,0.16)',
  warning: '#D48A11',
  danger: '#D94545',
  dangerSoft: 'rgba(217,69,69,0.16)',
  textPrimary: '#141B31',
  textSecondary: '#48526F',
  textTertiary: '#707B98',
  textInverse: '#FFFFFF',
  divider: 'rgba(20,27,49,0.08)',
  dividerStrong: 'rgba(20,27,49,0.14)',
  border: 'rgba(20,27,49,0.11)',
  overlay: 'rgba(17,22,43,0.38)',
  scrim: 'rgba(11,16,34,0.32)',
  gradientHero: ['#FF6138', '#FF9061'],
  gradientNight: ['#FFFFFF', '#F2F5FC'],
  gradientGold: ['#F2B83F', '#ECA53B'],
  gradientPlay: ['#FF6138', '#F2B83F'],
};

export const palettes = { dark, light };
export const colorScheme = Appearance.getColorScheme() || 'dark';
export const colors = colorScheme === 'light' ? light : dark;

export default colors;
