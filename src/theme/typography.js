// Typography scale — Inter loaded via @expo-google-fonts/inter.
// Falls back to system if fonts haven't loaded; UI must remain legible.

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export const typography = {
  display: {
    fontFamily: fontFamily.extrabold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.9,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 25,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.15,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 23,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 23,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  captionMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  mono: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
  },
};

export default typography;
